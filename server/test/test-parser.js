const resumeParser = require('../utils/resumeParserEnhanced');
const path = require('path');

// Test sample text that mimics your resume format
const sampleResumeText = `
SACHIN JANGID
sachinjangid1016@gmail.com | 8949639313 | Jaipur, Rajasthan
Portfolio: https://sachinjangid.netlify.app
GitHub: https://github.com/imsachin001
LinkedIn: https://linkedin.com/in/sachinjangid

CAREER OBJECTIVE
Aspiring Software Developer with expertise in MERN stack and competitive programming. Seeking opportunities to contribute to innovative projects.

EDUCATION
Indian Institute of Information Technology, Trichy
B.Tech in Computer Science Engineering
2023-2027
CGPA: 8.5/10

TECHNICAL SKILLS
Programming Languages: C++, Python, JavaScript, Java
Frameworks & Libraries: React Js, NodeJs, ExpressJs, MongoDB, HTML, CSS, Tailwind CSS
Tools & Technologies: Git, GitHub, VS Code, Postman
Data Science: Pandas, Numpy, Matplotlib

PROJECTS
1. AI Productivity Assistant (In Progress)
   Tech Stack: React, Node, MongoDB, Python, Tailwind, Recharts
   - Developed an AI-powered task management system with intelligent suggestions
   - Integrated LangChain for natural language processing
   - Built RESTful APIs using Express and MongoDB
   GitHub: https://github.com/imsachin001/ai-productivity
   Demo: https://ai-productivity.netlify.app

2. Airbnb Clone (Completed)
   Tech Stack: React, NodeJs, ExpressJs, MongoDB
   - Created a full-stack vacation rental platform
   - Implemented authentication, booking system, and image uploads
   - Responsive design with React and CSS
   GitHub: https://github.com/imsachin001/airbnb-clone

ACHIEVEMENTS & EXPERIENCE
LeetCode: Knight Badge (Rating: 1968)
- Solved 500+ coding problems across various difficulty levels
- Specialized in Data Structures and Algorithms

CodeChef: 3 Star (Rating: 1637)
- Participated in monthly contests regularly
- Achieved top 500 rank in Division 2

Codeforces: Rating 1320
- Active participant in competitive programming contests
`;

console.log('='.repeat(80));
console.log('TESTING ENHANCED RESUME PARSER');
console.log('='.repeat(80));

// Test Personal Info Extraction
console.log('\n📋 Testing Personal Info Extraction...');
const personalInfo = {
    name: 'SACHIN JANGID',
    email: 'sachinjangid1016@gmail.com',
    phone: '8949639313',
    location: 'Jaipur, Rajasthan',
    portfolio: 'https://sachinjangid.netlify.app',
    github: 'https://github.com/imsachin001',
    linkedin: 'https://linkedin.com/in/sachinjangid'
};

console.log('Expected:', personalInfo);
console.log('✅ Manual verification needed after live test\n');

// Test Skills Categorization
console.log('📚 Testing Skills Categorization...');
const expectedSkills = {
    languages: ['C++', 'Python', 'JavaScript', 'Java'],
    frameworks: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind'],
    databases: ['MongoDB'],
    tools: ['Git', 'GitHub', 'VS Code', 'Postman'],
    ai_ml: ['Pandas', 'NumPy', 'LangChain', 'Matplotlib'],
    soft_skills: []
};

console.log('Expected Skills Categories:');
console.log('  Languages:', expectedSkills.languages);
console.log('  Frameworks:', expectedSkills.frameworks);
console.log('  Databases:', expectedSkills.databases);
console.log('  Tools:', expectedSkills.tools);
console.log('  AI/ML:', expectedSkills.ai_ml);
console.log('✅ Should match these categories with variations (React Js → React, NodeJs → Node.js)\n');

// Test Projects Extraction
console.log('🚀 Testing Projects Extraction...');
const expectedProjects = [
    {
        name: 'AI Productivity Assistant',
        tech_stack: ['React', 'Node', 'MongoDB', 'Python', 'Tailwind', 'Recharts'],
        description: 'AI-powered task management system',
        github_link: 'https://github.com/imsachin001/ai-productivity',
        demo_link: 'https://ai-productivity.netlify.app',
        status: 'In Progress'
    },
    {
        name: 'Airbnb Clone',
        tech_stack: ['React', 'NodeJs', 'ExpressJs', 'MongoDB'],
        description: 'Full-stack vacation rental platform',
        github_link: 'https://github.com/imsachin001/airbnb-clone',
        status: 'Completed'
    }
];

console.log('Expected Projects:');
expectedProjects.forEach((project, i) => {
    console.log(`  ${i+1}. ${project.name}`);
    console.log(`     Tech Stack: ${project.tech_stack.join(', ')}`);
    console.log(`     Status: ${project.status}`);
    console.log(`     GitHub: ${project.github_link}`);
});
console.log('✅ Should extract 2 projects with tech stacks\n');

// Test Experience/Achievements Extraction
console.log('🏆 Testing Experience/Achievements Extraction...');
const expectedExperience = [
    {
        platform: 'LeetCode',
        role: 'Knight Badge',
        description: 'Solved 500+ coding problems',
        achievements: ['Rating: 1968', '500+ problems']
    },
    {
        platform: 'CodeChef',
        role: '3 Star',
        description: 'Monthly contest participant',
        achievements: ['Rating: 1637', 'Top 500 rank']
    },
    {
        platform: 'Codeforces',
        role: 'Competitive Programmer',
        description: 'Active participant',
        achievements: ['Rating: 1320']
    }
];

console.log('Expected Achievements:');
expectedExperience.forEach((exp, i) => {
    console.log(`  ${i+1}. ${exp.platform} - ${exp.role}`);
    console.log(`     Achievements: ${exp.achievements.join(', ')}`);
});
console.log('✅ Should extract coding platform achievements\n');

// Test Education Extraction
console.log('🎓 Testing Education Extraction...');
const expectedEducation = [
    {
        institute: 'Indian Institute of Information Technology, Trichy',
        degree: 'B.Tech in Computer Science Engineering',
        duration: '2023-2027',
        achievements: ['CGPA: 8.5/10']
    }
];

console.log('Expected Education:');
expectedEducation.forEach((edu, i) => {
    console.log(`  ${i+1}. ${edu.institute}`);
    console.log(`     ${edu.degree} (${edu.duration})`);
    console.log(`     ${edu.achievements.join(', ')}`);
});
console.log('✅ Should extract institute, degree, duration\n');

// Test Summary Extraction
console.log('📝 Testing Summary Extraction...');
console.log('Expected: Should find "Aspiring Software Developer..." objective section');
console.log('✅ Should extract career objective\n');

console.log('='.repeat(80));
console.log('TEST EXPECTATIONS DEFINED');
console.log('='.repeat(80));
console.log('\n📌 NEXT STEP: Upload your actual resume (Sachinjangid (3).pdf) and verify:');
console.log('   1. Name = "Sachin Jangid" (not "EDUCATION")');
console.log('   2. Skills include React, Node.js, Express, MongoDB (from variations)');
console.log('   3. Projects array has 2 entries with tech_stack arrays');
console.log('   4. Experience shows LeetCode Knight, CodeChef 3★, Codeforces ratings');
console.log('   5. Education has IIIT Trichy');
console.log('   6. Summary extracted from objective\n');

console.log('🔍 Check server console logs after upload for debug output!\n');
