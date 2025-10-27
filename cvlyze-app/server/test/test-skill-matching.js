const AIAnalyzer = require('../utils/aiAnalyzer');

console.log('='.repeat(80));
console.log('TESTING SKILL SYNONYM MATCHING');
console.log('='.repeat(80));

// Sample resume text with various skill name variations
const resumeTextWithVariations = `
TECHNICAL SKILLS
- Programming: C++, Python, Java
- Frontend: React Js, HTML, CSS, JavaScript
- Backend: NodeJs, ExpressJs
- Database: MongoDb, SQL
- Tools: Git, GitHub, VS Code
- Data Science: Pandas, Numpy, Matplotlib

PROJECTS
Built an AI Assistant using React Js, Node Js, Express Js, and Mongo DB.
Implemented REST APIs with ExpressJs and MongoDB database.
`;

// Skills list to match (exactly as in JD)
const jobDescriptionSkills = [
    'React',
    'Node.js', 
    'Express',
    'MongoDB',
    'Python',
    'JavaScript',
    'HTML',
    'CSS',
    'Git'
];

console.log('\n📋 Resume Text Contains (variations):');
console.log('   - React Js (should match "React")');
console.log('   - NodeJs, Node Js (should match "Node.js")');
console.log('   - ExpressJs, Express Js (should match "Express")');
console.log('   - MongoDb, Mongo DB (should match "MongoDB")');
console.log('   - C++, Python, Java, JavaScript');
console.log('   - HTML, CSS, Git, GitHub');
console.log('   - Pandas, Numpy, Matplotlib\n');

console.log('🎯 Job Description Skills (standard names):');
jobDescriptionSkills.forEach((skill, i) => {
    console.log(`   ${i+1}. ${skill}`);
});
console.log();

// Use the singleton analyzer instance (already instantiated in the module)
const analyzer = AIAnalyzer;

// Test skill matching
console.log('🔍 Running Skill Matching...\n');

// The method expects resume skills array and full text
// Extract skills from the sample text first (simplified for testing)
const resumeSkillsFromText = ['C++', 'Python', 'Java', 'React Js', 'HTML', 'CSS', 'JavaScript', 
                               'NodeJs', 'ExpressJs', 'MongoDb', 'SQL', 'Git', 'GitHub', 
                               'VS Code', 'Pandas', 'Numpy', 'Matplotlib'];

const matchedSkills = analyzer.matchSkillsAgainstDictionary(resumeSkillsFromText, resumeTextWithVariations);

console.log('✅ MATCHED SKILLS:');
if (matchedSkills.length > 0) {
    matchedSkills.forEach((skill, i) => {
        console.log(`   ${i+1}. ${skill}`);
    });
    console.log(`\n   Total: ${matchedSkills.length}/${jobDescriptionSkills.length} skills matched`);
} else {
    console.log('   ❌ NO SKILLS MATCHED - THIS INDICATES A PROBLEM!');
}

// Expected results
const expectedMatches = ['React', 'Node.js', 'Express', 'MongoDB', 'Python', 'JavaScript', 'HTML', 'CSS', 'Git'];
console.log('\n📊 Expected Matches:', expectedMatches.length);
console.log('📊 Actual Matches:', matchedSkills.length);

if (matchedSkills.length === expectedMatches.length) {
    console.log('✅ PASS: All variations matched correctly!');
} else {
    console.log('❌ FAIL: Missing skills detected');
    console.log('\n🔍 Debugging Info:');
    
    const missing = expectedMatches.filter(skill => !matchedSkills.includes(skill));
    if (missing.length > 0) {
        console.log('   Missing Skills:', missing.join(', '));
    }
    
    const extra = matchedSkills.filter(skill => !expectedMatches.includes(skill));
    if (extra.length > 0) {
        console.log('   Extra Skills:', extra.join(', '));
    }
}

console.log('\n' + '='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
console.log('\n💡 This test validates that skill variations like:');
console.log('   "React Js" → "React"');
console.log('   "NodeJs" → "Node.js"');
console.log('   "ExpressJs" → "Express"');
console.log('   "MongoDb" → "MongoDB"');
console.log('   are properly detected and normalized.\n');
