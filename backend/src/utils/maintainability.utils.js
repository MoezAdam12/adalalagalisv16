/**
 * Maintainability utilities for improving code quality and documentation
 */

/**
 * Generate JSDoc documentation for a function
 * @param {Function} fn - Function to document
 * @param {Object} options - Documentation options
 * @returns {string} JSDoc comment
 */
function generateJSDoc(fn, options = {}) {
  if (!fn || typeof fn !== 'function') {
    return '';
  }
  
  const {
    description = '',
    params = [],
    returns = { type: 'void', description: '' },
    examples = []
  } = options;
  
  let jsDoc = '/**\n';
  jsDoc += ` * ${description}\n`;
  
  // Add parameters
  params.forEach(param => {
    jsDoc += ` * @param {${param.type}} ${param.name} - ${param.description}\n`;
  });
  
  // Add return value
  jsDoc += ` * @returns {${returns.type}} ${returns.description}\n`;
  
  // Add examples
  examples.forEach(example => {
    jsDoc += ` * @example\n * ${example.replace(/\n/g, '\n * ')}\n`;
  });
  
  jsDoc += ' */';
  
  return jsDoc;
}

/**
 * Check code quality using simple heuristics
 * @param {string} code - Code to check
 * @returns {Object} Quality report
 */
function checkCodeQuality(code) {
  if (!code) {
    return { score: 0, issues: ['No code provided'] };
  }
  
  const issues = [];
  let score = 100;
  
  // Check for long functions (more than 30 lines)
  const functionMatches = code.match(/function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?}/g) || [];
  functionMatches.forEach(fn => {
    const lines = fn.split('\n').length;
    if (lines > 30) {
      issues.push(`Long function (${lines} lines): Consider breaking it down`);
      score -= 5;
    }
  });
  
  // Check for long lines (more than 100 characters)
  const codeLines = code.split('\n');
  codeLines.forEach((line, index) => {
    if (line.length > 100) {
      issues.push(`Line ${index + 1} is too long (${line.length} chars)`);
      score -= 2;
    }
  });
  
  // Check for complex conditionals
  const complexConditionals = (code.match(/if\s*\([^)]{50,}\)/g) || []).length;
  if (complexConditionals > 0) {
    issues.push(`${complexConditionals} complex conditional(s): Consider simplifying or extracting variables`);
    score -= complexConditionals * 3;
  }
  
  // Check for missing error handling
  const asyncFunctions = (code.match(/async\s+function|\.\s*then\s*\(/g) || []).length;
  const errorHandling = (code.match(/catch\s*\(|try\s*{/g) || []).length;
  if (asyncFunctions > errorHandling) {
    issues.push(`Missing error handling in some async functions`);
    score -= 5;
  }
  
  // Check for magic numbers
  const magicNumbers = (code.match(/[^a-zA-Z0-9_"']\d{3,}[^a-zA-Z0-9_"']/g) || []).length;
  if (magicNumbers > 0) {
    issues.push(`${magicNumbers} magic number(s): Consider using named constants`);
    score -= magicNumbers * 2;
  }
  
  // Check for commented-out code
  const commentedCode = (code.match(/\/\/.*[;{}]|\/\*[\s\S]*?[;{}][\s\S]*?\*\//g) || []).length;
  if (commentedCode > 0) {
    issues.push(`${commentedCode} instance(s) of commented-out code: Remove or document why it's kept`);
    score -= commentedCode * 2;
  }
  
  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    issues: issues.length > 0 ? issues : ['No issues found'],
    rating: score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor'
  };
}

/**
 * Apply consistent code formatting
 * @param {string} code - Code to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted code
 */
function formatCode(code, options = {}) {
  if (!code) return '';
  
  const {
    indentSize = 2,
    useTabs = false,
    maxLineLength = 80
  } = options;
  
  // This is a simple formatter, for production use a proper formatter like Prettier
  let formatted = '';
  let indentLevel = 0;
  
  const indent = useTabs ? '\t'.repeat(indentLevel) : ' '.repeat(indentLevel * indentSize);
  
  // Split by lines and process each line
  const lines = code.split('\n');
  
  lines.forEach(line => {
    // Trim the line
    const trimmedLine = line.trim();
    
    // Adjust indent level based on braces
    if (trimmedLine.endsWith('}') || trimmedLine.endsWith('};')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    // Add indentation
    const indentStr = useTabs ? '\t'.repeat(indentLevel) : ' '.repeat(indentLevel * indentSize);
    
    // Add the formatted line
    if (trimmedLine.length > 0) {
      formatted += indentStr + trimmedLine + '\n';
    } else {
      formatted += '\n'; // Keep empty lines
    }
    
    // Increase indent level for next line if this line opens a block
    if (trimmedLine.endsWith('{')) {
      indentLevel++;
    }
  });
  
  return formatted;
}

/**
 * Extract TODOs from code
 * @param {string} code - Code to analyze
 * @returns {Array} List of TODOs with line numbers
 */
function extractTodos(code) {
  if (!code) return [];
  
  const todos = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    const todoMatch = line.match(/\/\/\s*TODO:?\s*(.*)|\/\*\s*TODO:?\s*(.*?)\s*\*\//i);
    if (todoMatch) {
      const todoText = (todoMatch[1] || todoMatch[2]).trim();
      todos.push({
        line: index + 1,
        text: todoText,
        raw: line.trim()
      });
    }
  });
  
  return todos;
}

/**
 * Generate a dependency graph for modules
 * @param {Object} modules - Map of module paths to their dependencies
 * @returns {Object} Dependency graph
 */
function generateDependencyGraph(modules) {
  if (!modules || typeof modules !== 'object') {
    return { nodes: [], edges: [] };
  }
  
  const nodes = [];
  const edges = [];
  
  // Create nodes for each module
  Object.keys(modules).forEach(modulePath => {
    nodes.push({
      id: modulePath,
      label: modulePath.split('/').pop()
    });
    
    // Create edges for each dependency
    const dependencies = modules[modulePath];
    if (Array.isArray(dependencies)) {
      dependencies.forEach(dep => {
        edges.push({
          source: modulePath,
          target: dep
        });
      });
    }
  });
  
  return { nodes, edges };
}

/**
 * Check for circular dependencies
 * @param {Object} modules - Map of module paths to their dependencies
 * @returns {Array} List of circular dependency chains
 */
function findCircularDependencies(modules) {
  if (!modules || typeof modules !== 'object') {
    return [];
  }
  
  const circularDependencies = [];
  
  function checkPath(modulePath, visited = [], path = []) {
    // If we've already visited this module in the current path, we have a circular dependency
    if (path.includes(modulePath)) {
      const cycle = [...path.slice(path.indexOf(modulePath)), modulePath];
      circularDependencies.push(cycle);
      return;
    }
    
    // If we've already checked this module, skip it
    if (visited.includes(modulePath)) {
      return;
    }
    
    // Mark as visited
    visited.push(modulePath);
    
    // Add to current path
    path.push(modulePath);
    
    // Check dependencies
    const dependencies = modules[modulePath];
    if (Array.isArray(dependencies)) {
      dependencies.forEach(dep => {
        checkPath(dep, visited, [...path]);
      });
    }
  }
  
  // Check each module
  Object.keys(modules).forEach(modulePath => {
    checkPath(modulePath);
  });
  
  return circularDependencies;
}

module.exports = {
  generateJSDoc,
  checkCodeQuality,
  formatCode,
  extractTodos,
  generateDependencyGraph,
  findCircularDependencies
};
