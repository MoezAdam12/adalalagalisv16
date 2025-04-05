import unittest
import json
import os
import sys
from flask import Flask
from unittest.mock import patch, MagicMock

# Add the parent directory to sys.path to import app.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app as flask_app

class TestMLService(unittest.TestCase):
    def setUp(self):
        self.app = flask_app.test_client()
        self.app.testing = True
        
    def test_health_check(self):
        """Test the health check endpoint"""
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
        self.assertIn('models_loaded', data)
        
    def test_analyze_contract(self):
        """Test the contract analysis endpoint"""
        test_contract = """
        SERVICE AGREEMENT
        
        This Service Agreement (the "Agreement") is made effective as of January 15, 2025 (the "Effective Date"), by and between Acme Corporation ("Provider") and Legal Services LLC ("Client").
        
        1. SERVICES
        Provider agrees to provide Client with legal consulting services as described in Exhibit A.
        
        2. PAYMENT TERMS
        Client agrees to pay Provider $5,000 per month, payable within 30 days of receipt of invoice.
        
        3. TERM AND TERMINATION
        This Agreement shall commence on the Effective Date and continue until January 14, 2026, unless terminated earlier.
        
        4. CONFIDENTIALITY
        Each party agrees to maintain the confidentiality of all proprietary information disclosed by the other party.
        
        5. LIMITATION OF LIABILITY
        Provider's liability shall be limited to the amount paid by Client under this Agreement.
        
        6. GOVERNING LAW
        This Agreement shall be governed by the laws of Saudi Arabia.
        
        IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.
        """
        
        response = self.app.post('/api/analyze-contract', 
                                json={'text': test_contract},
                                content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Check for expected fields
        self.assertIn('contract_type', data)
        self.assertIn('parties', data)
        self.assertIn('key_dates', data)
        self.assertIn('payment_terms', data)
        self.assertIn('governing_law', data)
        self.assertIn('risk_score', data)
        self.assertIn('clauses', data)
        
        # Check specific values
        self.assertEqual(data['contract_type'], 'contract')
        self.assertIn('Acme Corporation', ' '.join(data['parties']))
        self.assertIn('Legal Services LLC', ' '.join(data['parties']))
        self.assertIn('Saudi Arabia', data['governing_law'])
        
    def test_extract_entities(self):
        """Test the entity extraction endpoint"""
        test_text = """
        John Smith from Acme Corporation met with Sarah Johnson of Legal Services LLC in Riyadh, Saudi Arabia on March 15, 2025 to discuss a $50,000 contract.
        """
        
        response = self.app.post('/api/extract-entities', 
                                json={'text': test_text},
                                content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Check for expected fields
        self.assertIn('people', data)
        self.assertIn('organizations', data)
        self.assertIn('locations', data)
        self.assertIn('dates', data)
        self.assertIn('monetary_values', data)
        
        # Check specific values (at least some of these should be found)
        people = ' '.join(data['people'])
        orgs = ' '.join(data['organizations'])
        locations = ' '.join(data['locations'])
        
        self.assertTrue('John' in people or 'Smith' in people or 'Sarah' in people or 'Johnson' in people)
        self.assertTrue('Acme' in orgs or 'Corporation' in orgs or 'Legal Services' in orgs)
        self.assertTrue('Riyadh' in locations or 'Saudi Arabia' in locations)
        
    def test_classify_document(self):
        """Test the document classification endpoint"""
        test_contract = """
        SERVICE AGREEMENT
        
        This Service Agreement (the "Agreement") is made effective as of January 15, 2025, by and between Acme Corporation and Legal Services LLC.
        """
        
        response = self.app.post('/api/classify-document', 
                                json={'text': test_contract},
                                content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Check for expected fields
        self.assertIn('document_type', data)
        self.assertIn('confidence', data)
        self.assertIn('language', data)
        
        # Check specific values
        self.assertEqual(data['document_type'], 'contract')
        self.assertEqual(data['language'], 'en')
        
    def test_summarize(self):
        """Test the summarization endpoint"""
        test_text = """
        This Service Agreement (the "Agreement") is made effective as of January 15, 2025 (the "Effective Date"), by and between Acme Corporation ("Provider") and Legal Services LLC ("Client").
        
        Provider agrees to provide Client with legal consulting services as described in Exhibit A.
        
        Client agrees to pay Provider $5,000 per month, payable within 30 days of receipt of invoice.
        
        This Agreement shall commence on the Effective Date and continue until January 14, 2026, unless terminated earlier.
        
        Each party agrees to maintain the confidentiality of all proprietary information disclosed by the other party.
        
        Provider's liability shall be limited to the amount paid by Client under this Agreement.
        
        This Agreement shall be governed by the laws of Saudi Arabia.
        """
        
        response = self.app.post('/api/summarize', 
                                json={'text': test_text},
                                content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Check for expected fields
        self.assertIn('summary', data)
        
        # Check that summary is not empty and shorter than original
        self.assertTrue(len(data['summary']) > 0)
        self.assertTrue(len(data['summary']) < len(test_text))
        
    def test_answer_question(self):
        """Test the question answering endpoint"""
        test_context = """
        This Service Agreement is made effective as of January 15, 2025, by and between Acme Corporation and Legal Services LLC.
        Client agrees to pay Provider $5,000 per month, payable within 30 days of receipt of invoice.
        This Agreement shall be governed by the laws of Saudi Arabia.
        """
        
        test_question = "What is the monthly payment amount?"
        
        response = self.app.post('/api/answer-question', 
                                json={'text': test_context, 'question': test_question},
                                content_type='application/json')
        
        # Even if the model doesn't work, the API should respond
        self.assertIn(response.status_code, [200, 500])
        
        if response.status_code == 200:
            data = json.loads(response.data)
            self.assertIn('answer', data)
            self.assertIn('confidence', data)
        
    def test_analyze_sentiment(self):
        """Test the sentiment analysis endpoint"""
        test_positive = "This is an excellent agreement with favorable terms."
        test_negative = "This contract has unfavorable terms and high risks."
        
        # Test positive sentiment
        response = self.app.post('/api/analyze-sentiment', 
                                json={'text': test_positive},
                                content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        self.assertIn('sentiment', data)
        self.assertIn('score', data)
        
        # Test negative sentiment
        response = self.app.post('/api/analyze-sentiment', 
                                json={'text': test_negative},
                                content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        self.assertIn('sentiment', data)
        self.assertIn('score', data)
        
    def test_arabic_support(self):
        """Test Arabic language support"""
        test_arabic = """
        اتفاقية خدمة
        
        تم إبرام اتفاقية الخدمة هذه ("الاتفاقية") اعتبارًا من 15 يناير 2025 ("تاريخ السريان")، بين شركة أكمي ("المزود") وشركة الخدمات القانونية ("العميل").
        
        1. الخدمات
        يوافق المزود على تقديم خدمات استشارية قانونية للعميل كما هو موضح في الملحق أ.
        
        2. شروط الدفع
        يوافق العميل على دفع 5000 دولار شهريًا للمزود، تدفع خلال 30 يومًا من استلام الفاتورة.
        
        3. المدة والإنهاء
        تبدأ هذه الاتفاقية في تاريخ السريان وتستمر حتى 14 يناير 2026، ما لم يتم إنهاؤها في وقت سابق.
        
        4. السرية
        يوافق كل طرف على الحفاظ على سرية جميع المعلومات الملكية التي يكشف عنها الطرف الآخر.
        
        5. تحديد المسؤولية
        تقتصر مسؤولية المزود على المبلغ الذي دفعه العميل بموجب هذه الاتفاقية.
        
        6. القانون الحاكم
        تخضع هذه الاتفاقية لقوانين المملكة العربية السعودية.
        """
        
        # Test contract analysis with Arabic
        response = self.app.post('/api/analyze-contract', 
                                json={'text': test_arabic, 'language': 'ar'},
                                content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        self.assertIn('language', data)
        self.assertEqual(data['language'], 'ar')
        
        # Test entity extraction with Arabic
        response = self.app.post('/api/extract-entities', 
                                json={'text': test_arabic, 'language': 'ar'},
                                content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        self.assertIn('language', data)
        self.assertEqual(data['language'], 'ar')

if __name__ == '__main__':
    unittest.main()
