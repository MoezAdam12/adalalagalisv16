import os
import logging
import json
import re
from datetime import datetime
from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
from dotenv import load_dotenv
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
import spacy
import tensorflow as tf
from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification, AutoModelForSequenceClassification

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO'),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Get model path from environment variable
MODEL_PATH = os.getenv('MODEL_PATH', '/app/models')
ENABLE_GPU = os.getenv('ENABLE_GPU', 'false').lower() == 'true'

logger.info(f"Starting ML service with model path: {MODEL_PATH}")
logger.info(f"GPU enabled: {ENABLE_GPU}")

# Download necessary NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
    logger.info("NLTK resources downloaded successfully")
except Exception as e:
    logger.error(f"Error downloading NLTK resources: {e}")

# Load spaCy models
try:
    # Load English model
    nlp_en = spacy.load("en_core_web_sm")
    # Load Arabic model if available, otherwise use multi-language model
    try:
        nlp_ar = spacy.load("ar_core_news_sm")
    except:
        logger.warning("Arabic spaCy model not found, using multi-language model")
        nlp_ar = spacy.load("xx_ent_wiki_sm")
    
    logger.info("spaCy models loaded successfully")
except Exception as e:
    logger.error(f"Error loading spaCy models: {e}")
    # Fallback to simple NLP if spaCy fails
    nlp_en = None
    nlp_ar = None

# Initialize transformers models
def load_transformers_models():
    models = {}
    
    try:
        # Configure GPU/CPU settings
        if not ENABLE_GPU:
            tf.config.set_visible_devices([], 'GPU')
            os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
            logger.info("GPU disabled for TensorFlow")
        
        # Document classification model
        models["document_classifier"] = pipeline(
            "text-classification", 
            model="distilbert-base-uncased-finetuned-sst-2-english",
            device=-1 if not ENABLE_GPU else 0
        )
        
        # Named entity recognition model
        models["ner_model"] = pipeline(
            "ner", 
            model="dbmdz/bert-large-cased-finetuned-conll03-english",
            aggregation_strategy="simple",
            device=-1 if not ENABLE_GPU else 0
        )
        
        # Sentiment analysis model
        models["sentiment_analyzer"] = pipeline(
            "sentiment-analysis",
            model="nlptown/bert-base-multilingual-uncased-sentiment",
            device=-1 if not ENABLE_GPU else 0
        )
        
        # Summarization model
        models["summarizer"] = pipeline(
            "summarization",
            model="facebook/bart-large-cnn",
            device=-1 if not ENABLE_GPU else 0
        )
        
        # Question answering model
        models["qa_model"] = pipeline(
            "question-answering",
            model="distilbert-base-cased-distilled-squad",
            device=-1 if not ENABLE_GPU else 0
        )
        
        logger.info("Transformer models loaded successfully")
        return models
    
    except Exception as e:
        logger.error(f"Error loading transformer models: {e}")
        return {}

# Load models
transformers_models = load_transformers_models()

# Contract analysis patterns and rules
contract_patterns = {
    "effective_date": r"(?i)effective\s+(?:as\s+of\s+)?(?:the\s+)?(?:date\s+(?:of|on|hereof)|date)?\s*:?\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})",
    "termination_date": r"(?i)(?:terminat(?:ion|e)|expir(?:ation|e)|end)\s+(?:date|on)\s*:?\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})",
    "payment_terms": r"(?i)(?:payment\s+terms|terms\s+of\s+payment)\s*:?\s*([^\.;]+)",
    "governing_law": r"(?i)(?:governing\s+law|law\s+govern(?:s|ing))\s*:?\s*([^\.;]+)",
    "parties": r"(?i)(?:between|among|party)\s+([A-Z][A-Za-z\s,]+(?:LLC|Inc\.|Corporation|Corp\.|Ltd\.|Limited|Co\.|Company))",
    "confidentiality": r"(?i)(?:confidential(?:ity)?|non-disclosure)\s+([^\.;]+)",
    "indemnification": r"(?i)(?:indemnif(?:y|ication)|hold\s+harmless)\s+([^\.;]+)",
    "limitation_of_liability": r"(?i)(?:limit(?:ation|ing)?\s+(?:of|on)\s+liability)\s+([^\.;]+)",
    "force_majeure": r"(?i)(?:force\s+majeure|act(?:s)?\s+of\s+god)\s+([^\.;]+)",
    "dispute_resolution": r"(?i)(?:dispute\s+resolution|arbitration|mediation)\s+([^\.;]+)"
}

# Contract clause risk assessment rules
risk_assessment_rules = {
    "high_risk_terms": [
        "unlimited liability", "sole discretion", "unilateral", "without notice", 
        "without cause", "without limitation", "without consent", "irrevocable", 
        "perpetual", "unrestricted", "unconditional", "non-negotiable"
    ],
    "medium_risk_terms": [
        "reasonable efforts", "commercially reasonable", "material breach", 
        "substantial", "significant", "best efforts", "good faith"
    ],
    "low_risk_terms": [
        "mutual", "reasonable notice", "written consent", "written notice", 
        "limited liability", "reasonable time", "jointly"
    ]
}

# Document type classification rules
document_types = {
    "contract": ["agreement", "contract", "terms", "conditions", "covenant", "deed", "license"],
    "legal_opinion": ["opinion", "legal opinion", "advice", "counsel", "recommendation"],
    "court_filing": ["complaint", "motion", "petition", "pleading", "brief", "memorandum", "affidavit"],
    "corporate_document": ["bylaws", "articles", "incorporation", "resolution", "minutes", "certificate"],
    "regulatory_filing": ["filing", "report", "disclosure", "compliance", "regulatory", "statement"]
}

# Helper functions
def detect_language(text):
    """Detect if text is primarily in English or Arabic"""
    # Simple heuristic: check for Arabic characters
    arabic_pattern = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+')
    arabic_matches = arabic_pattern.findall(text)
    
    # If more than 10% of the text contains Arabic characters, consider it Arabic
    if len(''.join(arabic_matches)) > len(text) * 0.1:
        return "ar"
    return "en"

def extract_dates(text):
    """Extract dates from text using regex patterns"""
    date_patterns = [
        r'\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}',  # DD/MM/YYYY, MM/DD/YYYY, etc.
        r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}',  # Month DD, YYYY
        r'\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?,?\s+\d{4}'  # DD Month YYYY
    ]
    
    dates = []
    for pattern in date_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        dates.extend(matches)
    
    return dates

def extract_monetary_values(text):
    """Extract monetary values from text using regex patterns"""
    money_patterns = [
        r'(?:USD|US\$|\$|SAR|SR|€|EUR|£|GBP)\s*\d+(?:,\d{3})*(?:\.\d{2})?',  # Currency symbol followed by amount
        r'\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars|USD|SAR|riyals|euros|EUR|pounds|GBP)'  # Amount followed by currency name
    ]
    
    values = []
    for pattern in money_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        values.extend(matches)
    
    return values

def assess_clause_risk(clause_text):
    """Assess the risk level of a contract clause"""
    clause_lower = clause_text.lower()
    
    # Count risk terms
    high_risk_count = sum(1 for term in risk_assessment_rules["high_risk_terms"] if term.lower() in clause_lower)
    medium_risk_count = sum(1 for term in risk_assessment_rules["medium_risk_terms"] if term.lower() in clause_lower)
    low_risk_count = sum(1 for term in risk_assessment_rules["low_risk_terms"] if term.lower() in clause_lower)
    
    # Determine risk level
    if high_risk_count > 0:
        return "high"
    elif medium_risk_count > low_risk_count:
        return "medium"
    else:
        return "low"

def classify_document_type(text):
    """Classify document type based on keyword presence"""
    text_lower = text.lower()
    
    # Count occurrences of type-specific keywords
    type_scores = {}
    for doc_type, keywords in document_types.items():
        type_scores[doc_type] = sum(1 for keyword in keywords if keyword.lower() in text_lower)
    
    # Find the document type with the highest score
    max_score = 0
    doc_type = "unknown"
    for t, score in type_scores.items():
        if score > max_score:
            max_score = score
            doc_type = t
    
    # If using transformers, enhance with model prediction
    confidence = max_score / (sum(type_scores.values()) or 1)  # Avoid division by zero
    
    if "document_classifier" in transformers_models and len(text) < 512:
        try:
            # Use only the first part of the text to avoid token limits
            model_result = transformers_models["document_classifier"](text[:512])
            # Combine rule-based and model-based classification
            if model_result[0]['score'] > 0.7:
                confidence = (confidence + model_result[0]['score']) / 2
        except Exception as e:
            logger.warning(f"Error using transformer for document classification: {e}")
    
    return doc_type, confidence

def extract_entities_with_spacy(text, language="en"):
    """Extract named entities using spaCy"""
    if language == "en" and nlp_en:
        nlp = nlp_en
    elif language == "ar" and nlp_ar:
        nlp = nlp_ar
    else:
        return None
    
    # Process text with spaCy
    doc = nlp(text)
    
    # Extract entities
    entities = {
        "people": [],
        "organizations": [],
        "locations": [],
        "dates": [],
        "monetary_values": []
    }
    
    for ent in doc.ents:
        if ent.label_ in ["PERSON", "PER"]:
            entities["people"].append(ent.text)
        elif ent.label_ in ["ORG", "ORGANIZATION"]:
            entities["organizations"].append(ent.text)
        elif ent.label_ in ["GPE", "LOC", "LOCATION"]:
            entities["locations"].append(ent.text)
        elif ent.label_ in ["DATE", "TIME"]:
            entities["dates"].append(ent.text)
        elif ent.label_ in ["MONEY", "CARDINAL"]:
            entities["monetary_values"].append(ent.text)
    
    # Remove duplicates
    for key in entities:
        entities[key] = list(set(entities[key]))
    
    return entities

def extract_entities_with_transformers(text):
    """Extract named entities using transformers"""
    if "ner_model" not in transformers_models:
        return None
    
    try:
        # Use transformer model for NER
        ner_results = transformers_models["ner_model"](text)
        
        # Group entities by type
        entities = {
            "people": [],
            "organizations": [],
            "locations": [],
            "dates": [],
            "monetary_values": []
        }
        
        current_entity = ""
        current_type = ""
        
        for entity in ner_results:
            # Map transformer entity types to our categories
            entity_type = None
            if entity["entity"].startswith("B-PER") or entity["entity"].startswith("I-PER"):
                entity_type = "people"
            elif entity["entity"].startswith("B-ORG") or entity["entity"].startswith("I-ORG"):
                entity_type = "organizations"
            elif entity["entity"].startswith("B-LOC") or entity["entity"].startswith("I-LOC"):
                entity_type = "locations"
            
            if entity_type:
                if entity["entity"].startswith("B-"):
                    # If we have a previous entity, add it to the list
                    if current_entity and current_type:
                        entities[current_type].append(current_entity.strip())
                    # Start a new entity
                    current_entity = entity["word"]
                    current_type = entity_type
                elif entity["entity"].startswith("I-") and current_type == entity_type:
                    # Continue the current entity
                    current_entity += " " + entity["word"]
        
        # Add the last entity if there is one
        if current_entity and current_type:
            entities[current_type].append(current_entity.strip())
        
        # Add dates and monetary values using regex
        entities["dates"] = extract_dates(text)
        entities["monetary_values"] = extract_monetary_values(text)
        
        # Remove duplicates
        for key in entities:
            entities[key] = list(set(entities[key]))
        
        return entities
    
    except Exception as e:
        logger.error(f"Error extracting entities with transformers: {e}")
        return None

def analyze_contract_clauses(text):
    """Analyze contract text to identify and assess clauses"""
    # Split text into sentences
    sentences = sent_tokenize(text)
    
    # Identify potential clauses
    clauses = []
    current_clause = ""
    current_clause_type = ""
    
    for sentence in sentences:
        # Check if sentence starts a new clause
        new_clause_type = None
        for clause_type, pattern in contract_patterns.items():
            if re.search(pattern, sentence, re.IGNORECASE):
                new_clause_type = clause_type
                break
        
        if new_clause_type:
            # If we have a previous clause, add it to the list
            if current_clause and current_clause_type:
                risk_level = assess_clause_risk(current_clause)
                clauses.append({
                    "type": current_clause_type,
                    "text": current_clause.strip(),
                    "risk_level": risk_level
                })
            
            # Start a new clause
            current_clause = sentence
            current_clause_type = new_clause_type
        elif current_clause_type:
            # Continue the current clause
            current_clause += " " + sentence
    
    # Add the last clause if there is one
    if current_clause and current_clause_type:
        risk_level = assess_clause_risk(current_clause)
        clauses.append({
            "type": current_clause_type,
            "text": current_clause.strip(),
            "risk_level": risk_level
        })
    
    return clauses

def extract_contract_metadata(text):
    """Extract metadata from contract text"""
    metadata = {}
    
    # Extract contract type
    doc_type, confidence = classify_document_type(text)
    metadata["contract_type"] = doc_type
    metadata["type_confidence"] = confidence
    
    # Extract dates
    effective_date_match = re.search(contract_patterns["effective_date"], text, re.IGNORECASE)
    if effective_date_match:
        metadata["effective_date"] = effective_date_match.group(1)
    
    termination_date_match = re.search(contract_patterns["termination_date"], text, re.IGNORECASE)
    if termination_date_match:
        metadata["termination_date"] = termination_date_match.group(1)
    
    # Extract payment terms
    payment_terms_match = re.search(contract_patterns["payment_terms"], text, re.IGNORECASE)
    if payment_terms_match:
        metadata["payment_terms"] = payment_terms_match.group(1).strip()
    
    # Extract governing law
    governing_law_match = re.search(contract_patterns["governing_law"], text, re.IGNORECASE)
    if governing_law_match:
        metadata["governing_law"] = governing_law_match.group(1).strip()
    
    # Extract parties
    parties = []
    party_matches = re.finditer(contract_patterns["parties"], text, re.IGNORECASE)
    for match in party_matches:
        parties.append(match.group(1).strip())
    
    if parties:
        metadata["parties"] = list(set(parties))
    
    return metadata

def calculate_contract_risk_score(clauses):
    """Calculate overall risk score based on clause risk levels"""
    if not clauses:
        return 0.0
    
    # Assign weights to risk levels
    risk_weights = {"high": 1.0, "medium": 0.5, "low": 0.1}
    
    # Calculate weighted risk score
    total_weight = 0
    risk_sum = 0
    
    for clause in clauses:
        risk_level = clause.get("risk_level", "low")
        risk_sum += risk_weights.get(risk_level, 0.1)
        total_weight += 1
    
    # Normalize to 0-1 range
    if total_weight > 0:
        normalized_score = risk_sum / (total_weight * 1.0)
    else:
        normalized_score = 0.0
    
    return round(normalized_score, 2)

def summarize_text(text, max_length=150):
    """Generate a summary of the text"""
    if "summarizer" not in transformers_models:
        # Fallback to extractive summarization
        sentences = sent_tokenize(text)
        if len(sentences) <= 3:
            return " ".join(sentences)
        
        # Simple extractive summarization
        return " ".join(sentences[:3])
    
    try:
        # Use transformer model for summarization
        # Limit input length to avoid token limits
        max_input_length = 1024
        if len(text) > max_input_length:
            text = text[:max_input_length]
        
        summary = transformers_models["summarizer"](
            text, 
            max_length=max_length, 
            min_length=30, 
            do_sample=False
        )
        
        return summary[0]['summary_text']
    
    except Exception as e:
        logger.error(f"Error summarizing text with transformers: {e}")
        # Fallback to extractive summarization
        sentences = sent_tokenize(text)
        if len(sentences) <= 3:
            return " ".join(sentences)
        
        return " ".join(sentences[:3])

# API Endpoints
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy", 
        "models_loaded": {
            "spacy": {"en": nlp_en is not None, "ar": nlp_ar is not None},
            "transformers": list(transformers_models.keys())
        }
    })

@app.route('/api/analyze-contract', methods=['POST'])
def analyze_contract():
    """Analyze contract text and extract key information"""
    if not request.json or 'text' not in request.json:
        return jsonify({"error": "Missing contract text"}), 400
    
    contract_text = request.json['text']
    language = request.json.get('language', detect_language(contract_text))
    
    # Extract contract metadata
    metadata = extract_contract_metadata(contract_text)
    
    # Analyze contract clauses
    clauses = analyze_contract_clauses(contract_text)
    
    # Calculate risk score
    risk_score = calculate_contract_risk_score(clauses)
    
    # Generate summary
    summary = summarize_text(contract_text)
    
    # Prepare response
    analysis_result = {
        "contract_type": metadata.get("contract_type", "Unknown"),
        "type_confidence": metadata.get("type_confidence", 0.0),
        "parties": metadata.get("parties", []),
        "key_dates": {
            "effective_date": metadata.get("effective_date", ""),
            "termination_date": metadata.get("termination_date", "")
        },
        "payment_terms": metadata.get("payment_terms", ""),
        "governing_law": metadata.get("governing_law", ""),
        "risk_score": risk_score,
        "summary": summary,
        "clauses": clauses,
        "language": language
    }
    
    return jsonify(analysis_result)

@app.route('/api/extract-entities', methods=['POST'])
def extract_entities():
    """Extract legal entities from document text"""
    if not request.json or 'text' not in request.json:
        return jsonify({"error": "Missing document text"}), 400
    
    document_text = request.json['text']
    language = request.json.get('language', detect_language(document_text))
    
    # Try to extract entities with spaCy
    entities_spacy = extract_entities_with_spacy(document_text, language)
    
    # Try to extract entities with transformers
    entities_transformers = extract_entities_with_transformers(document_text)
    
    # Merge results, preferring transformer results when available
    if entities_transformers and entities_spacy:
        entities = {
            "people": list(set(entities_transformers.get("people", []) + entities_spacy.get("people", []))),
            "organizations": list(set(entities_transformers.get("organizations", []) + entities_spacy.get("organizations", []))),
            "locations": list(set(entities_transformers.get("locations", []) + entities_spacy.get("locations", []))),
            "dates": list(set(entities_transformers.get("dates", []) + entities_spacy.get("dates", []))),
            "monetary_values": list(set(entities_transformers.get("monetary_values", []) + entities_spacy.get("monetary_values", [])))
        }
    elif entities_transformers:
        entities = entities_transformers
    elif entities_spacy:
        entities = entities_spacy
    else:
        # Fallback to regex-based extraction
        entities = {
            "people": [],
            "organizations": [],
            "locations": [],
            "dates": extract_dates(document_text),
            "monetary_values": extract_monetary_values(document_text)
        }
    
    # Add language information
    entities["language"] = language
    
    return jsonify(entities)

@app.route('/api/classify-document', methods=['POST'])
def classify_document():
    """Classify document type"""
    if not request.json or 'text' not in request.json:
        return jsonify({"error": "Missing document text"}), 400
    
    document_text = request.json['text']
    language = request.json.get('language', detect_language(document_text))
    
    # Classify document type
    doc_type, confidence = classify_document_type(document_text)
    
    # Generate summary
    summary = summarize_text(document_text)
    
    # Prepare response
    classification = {
        "document_type": doc_type,
        "confidence": confidence,
        "language": language,
        "summary": summary
    }
    
    return jsonify(classification)

@app.route('/api/summarize', methods=['POST'])
def summarize_document():
    """Generate a summary of document text"""
    if not request.json or 'text' not in request.json:
        return jsonify({"error": "Missing document text"}), 400
    
    document_text = request.json['text']
    max_length = request.json.get('max_length', 150)
    
    # Generate summary
    summary = summarize_text(document_text, max_length)
    
    return jsonify({"summary": summary})

@app.route('/api/answer-question', methods=['POST'])
def answer_question():
    """Answer a question based on document context"""
    if not request.json or 'text' not in request.json or 'question' not in request.json:
        return jsonify({"error": "Missing document text or question"}), 400
    
    document_text = request.json['text']
    question = request.json['question']
    
    if "qa_model" not in transformers_models:
        return jsonify({"error": "Question answering model not available"}), 500
    
    try:
        # Use transformer model for question answering
        # Limit context length to avoid token limits
        max_context_length = 512
        if len(document_text) > max_context_length:
            # Simple approach: use the first part of the document
            context = document_text[:max_context_length]
        else:
            context = document_text
        
        answer = transformers_models["qa_model"](
            question=question,
            context=context
        )
        
        return jsonify({
            "answer": answer['answer'],
            "confidence": answer['score'],
            "start": answer['start'],
            "end": answer['end']
        })
    
    except Exception as e:
        logger.error(f"Error answering question with transformers: {e}")
        return jsonify({"error": f"Failed to answer question: {str(e)}"}), 500

@app.route('/api/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    """Analyze sentiment of text"""
    if not request.json or 'text' not in request.json:
        return jsonify({"error": "Missing text"}), 400
    
    text = request.json['text']
    
    if "sentiment_analyzer" not in transformers_models:
        # Fallback to simple sentiment analysis
        positive_words = ["good", "great", "excellent", "positive", "beneficial", "favorable", "advantageous"]
        negative_words = ["bad", "poor", "negative", "unfavorable", "disadvantageous", "harmful", "detrimental"]
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            sentiment = "positive"
            score = 0.5 + (positive_count - negative_count) / (positive_count + negative_count) * 0.5
        elif negative_count > positive_count:
            sentiment = "negative"
            score = 0.5 - (negative_count - positive_count) / (negative_count + positive_count) * 0.5
        else:
            sentiment = "neutral"
            score = 0.5
        
        return jsonify({
            "sentiment": sentiment,
            "score": score
        })
    
    try:
        # Use transformer model for sentiment analysis
        # Limit input length to avoid token limits
        max_input_length = 512
        if len(text) > max_input_length:
            text = text[:max_input_length]
        
        result = transformers_models["sentiment_analyzer"](text)
        
        # Map 1-5 star rating to sentiment
        label = result[0]['label']
        score = result[0]['score']
        
        if "1" in label or "2" in label:
            sentiment = "negative"
        elif "3" in label:
            sentiment = "neutral"
        else:  # "4" or "5"
            sentiment = "positive"
        
        return jsonify({
            "sentiment": sentiment,
            "score": score,
            "label": label
        })
    
    except Exception as e:
        logger.error(f"Error analyzing sentiment with transformers: {e}")
        return jsonify({"error": f"Failed to analyze sentiment: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=os.getenv('NODE_ENV') == 'development')
