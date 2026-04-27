// ─────────────────────────────────────────────────────────────────────────────
// IntelliGrade — Unified Data Store (single source of truth)
//
// One localStorage-backed object that every page/component reads & writes:
//   • Department (IT) → Batches (2023-2027, 2024-2028) → Sections (IT1/2/3) → Students
//   • Faculty list
//   • Subject catalogue (Sem 1-8 IT curriculum)
//   • Teaching assignments  (faculty × subject × section × academicYear)
//   • CIE marks             (per assignment, per student, per assessment)
//
// All views — Department/Students "View Marks", Faculty "View subject-wise
// marks", Student dashboard — derive from this same store, so changes in one
// place are reflected everywhere. Marks are seeded randomly on first run.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "intelligrade.store.v6";

// ─── Subject catalogue (full IT curriculum, sem 1-8) ────────────────────────
const SUBJECTS = [
  // Sem 1
  { code: "22MTC01", name: "Linear Algebra & Calculus", credits: 4, type: "T", semester: 1, abbreviation: "LAC" },
  { code: "22PYC01", name: "Optics and Semiconductor Physics", credits: 3, type: "T", semester: 1, abbreviation: "OSP" },
  { code: "22CSC01", name: "Problem Solving and Programming", credits: 3, type: "T", semester: 1, abbreviation: "PSP" },
  { code: "22EGC01", name: "English", credits: 2, type: "T", semester: 1, abbreviation: "ENG" },
  { code: "22PYC03", name: "Optics and Semiconductor Physics Lab", credits: 1.5, type: "P", semester: 1, abbreviation: "OSP Lab" },
  { code: "22EGC02", name: "English Lab", credits: 1, type: "P", semester: 1, abbreviation: "ENG Lab" },
  { code: "22CSC02", name: "Problem Solving and Programming Lab", credits: 1.5, type: "P", semester: 1, abbreviation: "PSP Lab" },
  { code: "22MEC01", name: "CAD and Drafting", credits: 2.5, type: "P", semester: 1, abbreviation: "CAD" },
  { code: "22MEC38", name: "Digital Fabrication Lab", credits: 1.5, type: "P", semester: 1, abbreviation: "DF Lab" },
  // Sem 2
  { code: "22MTC04", name: "Differential Equations & Numerical Methods", credits: 4, type: "T", semester: 2, abbreviation: "DENM" },
  { code: "22CYC01", name: "Chemistry", credits: 3, type: "T", semester: 2, abbreviation: "CHEM" },
  { code: "22EEC01", name: "Basic Electrical Engineering", credits: 3, type: "T", semester: 2, abbreviation: "BEE" },
  { code: "22CSC03", name: "Object Oriented Programming", credits: 3, type: "T", semester: 2, abbreviation: "OOP" },
  { code: "22CYC02", name: "Chemistry Lab", credits: 1.5, type: "P", semester: 2, abbreviation: "CHEM Lab" },
  { code: "22MBC02", name: "Community Engagement", credits: 1.5, type: "P", semester: 2, abbreviation: "CE" },
  { code: "22CSC04", name: "Object Oriented Programming Lab", credits: 1, type: "P", semester: 2, abbreviation: "OOP Lab" },
  { code: "22MEC37", name: "Robotics and Drones Lab", credits: 3, type: "P", semester: 2, abbreviation: "RD Lab" },
  { code: "22EEC02", name: "Basic Electrical Engineering Lab", credits: 1, type: "P", semester: 2, abbreviation: "BEE Lab" },
  // Sem 3
  { code: "22ITC01", name: "Digital Logic and Computer Architecture", credits: 3, type: "T", semester: 3, abbreviation: "DLCA" },
  { code: "22CSC05", name: "Data Structures", credits: 3, type: "T", semester: 3, abbreviation: "DS" },
  { code: "22CSC32", name: "Discrete Mathematics", credits: 3, type: "T", semester: 3, abbreviation: "DM" },
  { code: "22ITC02", name: "Java Programming", credits: 3, type: "T", semester: 3, abbreviation: "Java" },
  { code: "22CSC15", name: "Operating Systems", credits: 3, type: "T", semester: 3, abbreviation: "OS" },
  { code: "22EGM01", name: "Indian Constitution and Fundamental Principles", credits: 0, type: "T", semester: 3, abbreviation: "ICFP" },
  { code: "22ADE01", name: "Data Analysis and Visualization", credits: 3, type: "T", semester: 3, abbreviation: "DAV" },
  { code: "22CSC31", name: "Data Structures Lab", credits: 1, type: "P", semester: 3, abbreviation: "DS Lab" },
  { code: "22ITC03", name: "Java Programming Lab", credits: 1, type: "P", semester: 3, abbreviation: "Java Lab" },
  { code: "22ITC04", name: "Operating Systems Lab", credits: 1, type: "P", semester: 3, abbreviation: "OS Lab" },
  { code: "22ITC05", name: "IT Workshop", credits: 1, type: "P", semester: 3, abbreviation: "IT Workshop" },
  { code: "22ITI01", name: "MOOCs/Training/Internship", credits: 2, type: "P", semester: 3, abbreviation: "Internship-I" },
  // Sem 4
  { code: "22MTC15", name: "Probability and Queueing Theory", credits: 4, type: "T", semester: 4, abbreviation: "PQT" },
  { code: "22ECC40", name: "DC Circuits, Sensors and Transducers", credits: 3, type: "T", semester: 4, abbreviation: "DCCST" },
  { code: "22CSC11", name: "Database Management Systems", credits: 3, type: "T", semester: 4, abbreviation: "DBMS" },
  { code: "22CSC14", name: "Design and Analysis of Algorithms", credits: 3, type: "T", semester: 4, abbreviation: "DAA" },
  { code: "22ITE01", name: "Data Mining", credits: 3, type: "T", semester: 4, abbreviation: "DM" },
  { code: "22ITE02", name: "Digital Image Processing", credits: 3, type: "T", semester: 4, abbreviation: "DIP" },
  { code: "22ITE03", name: "Fundamentals of Cryptography", credits: 3, type: "T", semester: 4, abbreviation: "FOC" },
  { code: "22ITE04", name: "Mobile Application Development", credits: 3, type: "T", semester: 4, abbreviation: "MAD" },
  { code: "22MBC01", name: "Engineering Economics & Accountancy", credits: 3, type: "T", semester: 4, abbreviation: "EEA" },
  { code: "22CEM01", name: "Environmental Science", credits: 0, type: "T", semester: 4, abbreviation: "EVS" },
  { code: "22CSC33", name: "Database Management Systems Lab", credits: 1, type: "P", semester: 4, abbreviation: "DBMS Lab" },
  { code: "22ITC06", name: "Algorithms Lab", credits: 1, type: "P", semester: 4, abbreviation: "DAA Lab" },
  { code: "22ITC07", name: "Mini Project - I", credits: 1, type: "P", semester: 4, abbreviation: "Mini Project-I" },
  // Sem 5
  { code: "22CSC21", name: "Software Engineering", credits: 3, type: "T", semester: 5, abbreviation: "SE" },
  { code: "22ITC08", name: "Enterprise Application Development", credits: 3, type: "T", semester: 5, abbreviation: "EAD" },
  { code: "22CAC17", name: "Machine Learning", credits: 3, type: "T", semester: 5, abbreviation: "ML" },
  { code: "22ITC10", name: "Computer Networks", credits: 3, type: "T", semester: 5, abbreviation: "CN" },
  { code: "22ITC12", name: "Formal Languages and Automata Theory", credits: 3, type: "T", semester: 5, abbreviation: "FLAT" },
  { code: "22ITE05", name: "Service Oriented Architecture", credits: 3, type: "T", semester: 5, abbreviation: "SOA" },
  { code: "22ITE06", name: "Software Project Management", credits: 3, type: "T", semester: 5, abbreviation: "SPM" },
  { code: "22ADE31", name: "Information Retrieval Systems", credits: 3, type: "T", semester: 5, abbreviation: "IRS" },
  { code: "22CIE55", name: "Cyber Security", credits: 3, type: "T", semester: 5, abbreviation: "CS" },
  { code: "22CIE15", name: "Extended Reality", credits: 3, type: "T", semester: 5, abbreviation: "XR" },
  { code: "22CSC23", name: "CASE Tools Lab", credits: 1, type: "P", semester: 5, abbreviation: "CASE Lab" },
  { code: "22ITC09", name: "Enterprise Application Development Lab", credits: 1, type: "P", semester: 5, abbreviation: "EAD Lab" },
  { code: "22ITC11", name: "Computer Networks Lab", credits: 1, type: "P", semester: 5, abbreviation: "CN Lab" },
  { code: "22CAC18", name: "Machine Learning Lab", credits: 1, type: "P", semester: 5, abbreviation: "ML Lab" },
  { code: "22ITC16", name: "Competitive Coding", credits: 1, type: "P", semester: 5, abbreviation: "CC" },
  { code: "22ITI02", name: "Industrial / Rural Internship-II", credits: 2, type: "P", semester: 5, abbreviation: "Internship-II" },
  // Sem 6
  { code: "22ADC12", name: "Big Data Analytics", credits: 3, type: "T", semester: 6, abbreviation: "BDA" },
  { code: "22ITC13", name: "Embedded Systems and Internet of Things", credits: 3, type: "T", semester: 6, abbreviation: "ESIoT" },
  { code: "22CAC04", name: "Deep Learning", credits: 3, type: "T", semester: 6, abbreviation: "DL" },
  { code: "22CSC24", name: "Compiler Design", credits: 3, type: "T", semester: 6, abbreviation: "CD" },
  { code: "22EEM01", name: "Universal Human Values II: Understanding Harmony", credits: 1, type: "T", semester: 6, abbreviation: "UHV" },
  { code: "22CAC15", name: "Artificial Intelligence", credits: 3, type: "T", semester: 6, abbreviation: "AI" },
  { code: "22ITE07", name: "Cloud Computing", credits: 3, type: "T", semester: 6, abbreviation: "CC" },
  { code: "22ITE09", name: "Advanced Computer Networks", credits: 3, type: "T", semester: 6, abbreviation: "ACN" },
  { code: "22CIE07", name: "Ethical Hacking", credits: 3, type: "T", semester: 6, abbreviation: "EH" },
  { code: "22ITE10", name: "Scalable Web Application Development", credits: 3, type: "T", semester: 6, abbreviation: "SWAD" },
  { code: "22CAE19", name: "Natural Language Processing", credits: 3, type: "T", semester: 6, abbreviation: "NLP" },
  { code: "22ADC13", name: "Big Data Analytics Lab", credits: 1, type: "P", semester: 6, abbreviation: "BDA Lab" },
  { code: "22ITC14", name: "Embedded Systems and IoT Lab", credits: 1, type: "P", semester: 6, abbreviation: "ESIoT Lab" },
  { code: "22CAC05", name: "Deep Learning Lab", credits: 1, type: "P", semester: 6, abbreviation: "DL Lab" },
  { code: "22ITC15", name: "Mini Project - II", credits: 1, type: "P", semester: 6, abbreviation: "Mini Project-II" },
  { code: "22EGC03", name: "Employability Skills", credits: 1, type: "P", semester: 6, abbreviation: "ES" },
  { code: "22ITU02", name: "Up-Skill Certification Course-II", credits: 0.5, type: "P", semester: 6, abbreviation: "Upskill-II" },
  // Sem 7
  { code: "22CAC08", name: "Data Science", credits: 3, type: "T", semester: 7, abbreviation: "DS" },
  { code: "22CIE27", name: "Blockchain Technology", credits: 3, type: "T", semester: 7, abbreviation: "BT" },
  { code: "22ITE12", name: "Augmented and Virtual Reality", credits: 3, type: "T", semester: 7, abbreviation: "AVR" },
  { code: "22CIE03", name: "Cyber Forensics", credits: 3, type: "T", semester: 7, abbreviation: "CF" },
  { code: "22ITE08", name: "Microservices Architecture", credits: 3, type: "T", semester: 7, abbreviation: "MSA" },
  { code: "22ADE02", name: "Distributed Systems", credits: 3, type: "T", semester: 7, abbreviation: "DSYS" },
  { code: "22ADE18", name: "Bioinformatics", credits: 3, type: "T", semester: 7, abbreviation: "BIO" },
  { code: "22MCO01", name: "Intellectual Property Rights", credits: 3, type: "T", semester: 7, abbreviation: "IPR" },
  { code: "22ECO01", name: "Environmental Impact Assessment", credits: 3, type: "T", semester: 7, abbreviation: "EIA" },
  { code: "22CEO01", name: "Remote Sensing and GIS", credits: 3, type: "T", semester: 7, abbreviation: "RSGIS" },
  { code: "22MEO01", name: "Product Design and Development", credits: 3, type: "T", semester: 7, abbreviation: "PDD" },
  { code: "22AEO01", name: "Robotics in Industry 4.0", credits: 3, type: "T", semester: 7, abbreviation: "RI4" },
  { code: "22ITC26", name: "Project Part-1", credits: 4, type: "P", semester: 7, abbreviation: "Project-1" },
  { code: "22ITC17", name: "Social Outreach", credits: 1, type: "P", semester: 7, abbreviation: "SO" },
  { code: "22ITU03", name: "Up-Skill Certification Course-III", credits: 0.5, type: "P", semester: 7, abbreviation: "Upskill-III" },
  // Sem 8
  { code: "22MAO01", name: "Fundamentals of Quantum Computing", credits: 3, type: "T", semester: 8, abbreviation: "FQC" },
  { code: "22MEO04", name: "Introduction to Operations Research", credits: 3, type: "T", semester: 8, abbreviation: "OR" },
  { code: "22EEO02", name: "Energy Conservation", credits: 3, type: "T", semester: 8, abbreviation: "EC" },
  { code: "22BTO04", name: "Bioinformatics", credits: 3, type: "T", semester: 8, abbreviation: "BIO" },
  { code: "22EGO01", name: "Technical Writing Skills", credits: 3, type: "T", semester: 8, abbreviation: "TWS" },
  { code: "22MEO06", name: "Principles of Entrepreneurship and Startups", credits: 3, type: "T", semester: 8, abbreviation: "ES" },
  { code: "22ECO02", name: "Remote Sensing and GIS", credits: 3, type: "T", semester: 8, abbreviation: "RSGIS" },
  { code: "22CEO02", name: "Disaster Risk Reduction and Management", credits: 3, type: "T", semester: 8, abbreviation: "DRRM" },
  { code: "22BTO05", name: "Cognitive Neuroscience", credits: 3, type: "T", semester: 8, abbreviation: "CN" },
  { code: "22EGO03", name: "Indian Traditional Knowledge", credits: 3, type: "T", semester: 8, abbreviation: "ITK" },
  { code: "22ITC27", name: "Technical Seminar", credits: 1, type: "P", semester: 8, abbreviation: "Seminar" },
  { code: "22ITC28", name: "Project Part-2", credits: 4, type: "P", semester: 8, abbreviation: "Project-2" },
];

// Faculty pool — Department of Information Technology (CBIT)
const FACULTY = [
  { id: "IT01", name: "Dr. P. Suresh", designation: "Professor", email: "jpsuresh.it@cbit.ac.in", mobile: "9885313161" },
  { id: "IT02", name: "Dr. Kolikipogu Ramakrishna", designation: "Professor", email: "ramakrishna.it@cbit.ac.in", mobile: "9912807907" },
  { id: "IT03", name: "Dr. M. Venu Gopalachari", designation: "Professor", email: "mvenugopalachari.it@cbit.ac.in", mobile: "9966199834" },
  { id: "IT04", name: "Dr. R. M. Krishna Sureddi", designation: "Associate Professor", email: "rmkrishnasureddi.it@cbit.ac.in", mobile: "8247370922" },
  { id: "IT05", name: "Dr. B. Veera Jyothi", designation: "Associate Professor", email: "veerajyothi.it@cbit.ac.in", mobile: "9652754950" },
  { id: "IT06", name: "Dr. T. Satyanarayana Murthy", designation: "Associate Professor", email: "tsmurthy.it@cbit.ac.in", mobile: "9025887845" },
  { id: "IT07", name: "Dr. P. Ramesh Babu", designation: "Associate Professor", email: "praneshbabu.it@cbit.ac.in", mobile: "9293750019" },
  { id: "IT08", name: "Dr. Ramu Kuchipudi", designation: "Associate Professor", email: "ramukuchipudi.it@cbit.ac.in", mobile: "9959983801" },
  { id: "IT09", name: "Dr. N. Sudhakar Yadav", designation: "Associate Professor", email: "sudhakaryadavn.it@cbit.ac.in", mobile: "7396385708" },
  { id: "IT10", name: "Dr. Sagar Gujjunoori", designation: "Associate Professor", email: "sagarqijunoori.it@cbit.ac.in", mobile: "8985827797" },
  { id: "IT11", name: "Dr. V. Prashanthi", designation: "Associate Professor", email: "prashanthiv.it@cbit.ac.in", mobile: "9966423914" },
  { id: "IT12", name: "Dr. D. Jayaram", designation: "Assistant Professor", email: "djayaram.it@cbit.ac.in", mobile: "9182578316" },
  { id: "IT13", name: "Dr. K. Sugamya", designation: "Assistant Professor", email: "ksugamya.it@cbit.ac.in", mobile: "9849673938" },
  { id: "IT14", name: "Dr. A. Sirisha", designation: "Assistant Professor", email: "asirisha_it@cbit.ac.in", mobile: "9885266048" },
  { id: "IT15", name: "Smt. E. Ramalakshmi", designation: "Assistant Professor", email: "ramalakshmi.it@cbit.ac.in", mobile: "9553602042" },
  { id: "IT16", name: "Dr. T. Prathima", designation: "Assistant Professor", email: "tprathima_it@cbit.ac.in", mobile: "9441044722" },
  { id: "IT17", name: "Smt. K. Swathi", designation: "Assistant Professor", email: "kswathi.it@cbit.ac.in", mobile: "9491388749" },
  { id: "IT18", name: "Sri V. Santhosh", designation: "Assistant Professor", email: "vsantosh.it@cbit.ac.in", mobile: "9030012209" },
  { id: "IT19", name: "Sri K. Gangadhar Rao", designation: "Assistant Professor", email: "kgangadhar_it@cbit.ac.in", mobile: "8977218085" },
  { id: "IT20", name: "Dr. U. Sai Ram", designation: "Assistant Professor", email: "usairam_it@cbit.ac.in", mobile: "8143364133" },
  { id: "IT21", name: "Dr. B. Swathi Sowmya", designation: "Assistant Professor", email: "swathisowmya.it@cbit.ac.in", mobile: "9494568008" },
  { id: "IT22", name: "Sri R. Govardhan Reddy", designation: "Assistant Professor", email: "rgovardhanreddy_it@cbit.ac.in", mobile: "8886161630" },
  { id: "IT23", name: "Sri Rudroju Sai Venkat", designation: "Assistant Professor", email: "saivenkat@cbit.ac.in", mobile: "7893286916" },
  { id: "IT24", name: "Sri G. Srikanth", designation: "Assistant Professor", email: "srikanth.it@cbit.ac.in", mobile: "9397807156" },
  { id: "IT25", name: "Sri N. Shiva Kumar", designation: "Assistant Professor", email: "shivakumarn.it@cbit.ac.in", mobile: "8008832804" },
  { id: "IT26", name: "Ms. P. Kiranmai", designation: "Assistant Professor", email: "kiranmai_it@cbit.ac.in", mobile: "9032315262" },
  { id: "IT27", name: "Dr. B. Harish Goud", designation: "Assistant Professor", email: "harishgoudb.it@cbit.ac.in", mobile: "9492863506" },
  { id: "IT28", name: "Ms. T. Madhuri", designation: "Assistant Professor", email: "tmadhuri_it@cbit.ac.in", mobile: "8985549671" },
  { id: "IT29", name: "Dr. Pragati Priyadarshinee", designation: "Assistant Professor", email: "pragatipriyadarshinee.it@cbit.ac.in", mobile: "8879827220" },
  { id: "IT30", name: "Mr. Vaskula Srikanth", designation: "Assistant Professor", email: "yaskulasrikanth.it@cbit.ac.in", mobile: "9849593825" },
  { id: "IT31", name: "Mrs. P. Swathi", designation: "Assistant Professor", email: "palamakulaswathi_it@cbit.ac.in", mobile: "8143889941" },
];

// ─── Real student rosters (CBIT IT Department) ──────────────────────────────
// Keyed by `${batchId}-${sectionName}` → array of { rollNumber, name }
const ROSTERS = {
  "B-2023-IT1": [
    ["160123737001","APPALA MEENAKSHI SINDHUJA"],["160123737002","ARIBA FATIMA"],["160123737003","HIRANMAI BANALA"],["160123737004","BANAVATH ANUSHA"],["160123737005","BASSA. SRILAKSHMI"],["160123737006","B.SRIMUGDHA"],["160123737007","BHUKYA SWAPNA"],["160123737008","BONALA. LAXMI PRASANNA"],["160123737009","TRISHACHALLA"],["160123737010","CHEEMARLA RISHITHA"],["160123737011","DAIDALA RUTHVIKA REDDY"],["160123737012","DEVANABOYINA CHANDANA"],["160123737013","SAHASRA"],["160123737014","KHAZI AAFREEN"],["160123737015","M ANUSREE"],["160123737016","M ADITI"],["160123737017","MARPALLI NIKHITHA SREE"],["160123737018","MATTAM SAHITHI"],["160123737019","NILAGAL NAVARATNA"],["160123737020","NANDINI PERVAR"],["160123737021","SAMIKSHA PODICHETTY"],["160123737022","VASUNDHRA DEVI"],["160123737023","RASHI KAUR"],["160123737024","SAHITI EDUPUGANTI"],["160123737025","JENNIFER SHALOM"],["160123737026","SK ALMASE GOHER"],["160123737027","SOUMYA VEMURI"],["160123737028","NIKITHA YAMSANI"],["160123737029","ABDUL RAHEEM"],["160123737030","AMIT KUMAR"],["160123737031","ANISH KODURU"],["160123737032","A VISHNU VARDHAN REDDY"],["160123737033","AYUSH KUMAR SINGH"],["160123737034","B VISHNUVARDAN"],["160123737035","B.SAI LOHITH"],["160123737036","BOINI VIVEK"],["160123737037","SURYA VARMA CHERUKURI"],["160123737038","D.THIRUPATHI"],["160123737039","GANDHARI VARUN REDDY"],["160123737040","GUDIBANDA KRISHNA MANOHAR REDD"],["160123737041","HRUTHIK"],["160123737042","K.H.HARSH"],["160123737043","K.MANICHANDER"],["160123737044","K.MANMOHAN RATHOD"],["160123737045","KETHAVATH NAVEEN"],["160123737046","AKASH"],["160123737047","L. NITHISH NAIK"],["160123737048","M.BHARAT KUMAR"],["160123737049","MEDAPALLY SHIVA REDDY"],["160123737050","M ABHILASH REDDY"],["160123737051","MOHAMMED ABDUL RAFE SAJID"],["160123737052","MOLUGU SHASHANK"],["160123737053","N YASHWANTH SARMA"],["160123737054","NIRISH REDDY"],["160123737055","OM UPLENCHWAR"],["160123737056","PALLE SAIRAM GOUD"],["160123737057","P.RUPESH KUMAR"],["160123737058","PRATYUSH KUMAR"],["160123737059","VYAS RALLAPALLI"],["160123737060","SADE VARUN TEJ VARMA"],["160123737061","SARVESH JHAWAR"],["160123737062","SURYA PRANAY GOUD"],["160123737063","SWETHAK SWARNA"],["160123737064","THATIKONDA VIKRAM"],["160123737065","VEMURI VENKATA PHANI KUMAR"],["160123737066","VOTUKURU NOMESH REDDY"],["160123737067","YARRABOTHULA DILEEP"],["161023737301","A SAI PRAKASH"],["160123737303","NAGARAJU RODOPOLLU"],["160123737304","GANDHASIRI SATHWIKA"],["160123737305","GUNDELLY SRUJANA"],
  ],
  "B-2023-IT2": [
    ["160123737071","AMETI AKSHITHA"],["160123737072","HAMSAGOUNI RITHIKA"],["160123737073","KANDIMALLA SONY"],["160123737074","LAKSHANA.S"],["160123737075","MEGHANA"],["160123737076","MEHERUNNISA"],["160123737077","NIMMALA MADHURI"],["160123737079","PATI TEJASWINI"],["160123737080","POLKAMPALLI PRAGNA"],["160123737081","SAHITHI"],["160123737082","SARASWATULA SAMHITHA"],["160123737083","NIRUPAMA"],["160123737084","SRIRAMPURAM SUDHIKSHA REDDY"],["160123737085","T.RAKSHITHA"],["160123737086","THIRUKOVELA MOULYA"],["160123737087","MELISA BLOSSOM"],["160123737088","PRAVALIKA"],["160123737089","VIDIYALA ASHRITHA"],["160123737090","VUPPULAPU BHAVYA"],["160123737091","HARSHITA VUTHALURU"],["160123737092","ABDUL GAFOOR"],["160123737093","ABHIJITH DUGGARAJU"],["160123737094","ABHISHEK KUMAR SINGH"],["160123737095","A.BHARGAVA KRISHNA"],["160123737096","ALETI ANUDEEP REDDY"],["160123737097","ASHISH GUPTA"],["160123737098","BANDI SAI RISHWANTH"],["160123737099","REVANTH BOJJA"],["160123737101","DIRSINAPU JYOTHI VIKRAMA SIMHA R"],["160123737102","DODDA JITENDRA"],["160123737103","D.RUPESH REDDY"],["160123737104","SHIVA GANGISHETTY"],["160123737105","G.NITHISH KUMAR"],["160123737106","GRANDHI AVINASH"],["160123737107","GULLA MANEESH"],["160123737108","INDROJI SAI SUSHANK"],["160123737109","JAJIMOGGALA SUNIL"],["160123737110","K.SANCHAY JAIN"],["160123737111","K.SAI KIRAN"],["160123737112","KALYANAM ROSHAN VARMA"],["160123737113","K PREMSAGAR"],["160123737114","HARSHITHMANIK"],["160123737115","KANATALA SIDDHARTHA"],["160123737116","CHARAN KANKIPATI"],["160123737117","J.KARTHIKEYA"],["160123737118","KOTA PUNNAM"],["160123737119","K.SRISAI"],["160123737120","LAKSH JAIN"],["160123737121","M. NAVEEN KUMAR"],["160123737122","M.VEDAANTH SINGH"],["160123737123","MAJJI SANDEEP"],["160123737124","MOHD HASSAN"],["160123737125","YOGESH CHOUDHARY"],["160123737126","NALLAPOTHULA SHEKAR NAIDU"],["160123737127","N.MANISH"],["160123737128","P.V.ABHIRAM"],["160123737129","POLICE VIGNESHWAR REDDY"],["160123737130","REKULARAPU MURALI"],["160123737131","S SAI ASHRITH V R K N"],["160123737132","SAMA ASHOK"],["160123737133","PRANAVENDRA"],["160123737134","SHAIK AQEEL AHAMED"],["160123737135","SUSHANTH REDDY KASIREDDY"],["160123737136","T PREETHAM REDDY"],["160123737137","TUNGENA SHARATH"],["160123737308","CHITTURI NAGA RAJA TEJA ROHITH"],["160123737309","MOTHKURI RANVITHA"],["160123737310","KARNATAKAPU RAMAKRISHNA"],["160123737311","THATIKANTI ROHITH"],["160123737312","SINDHUJA BODDULA"],["160123737313","AKKENAPALLY NIKHIL"],["160123737314","BANOTH ANIL"],
  ],
  "B-2023-IT3": [
    ["160123737141","AMJA MAITHILI"],["160123737142","AVANI CHETLURI"],["160123737143","SONALI BANAPURAM"],["160123737144","B. PRIYANKA"],["160123737145","BHAVANA RAMAKRISHNA"],["160123737146","BOBBALA HARSHITHA"],["160123737147","CHINTHAKINDHI NISHITHA"],["160123737148","E.SPANDANA"],["160123737149","GAALI SAI PRAHARSHITA"],["160123737150","GADASANDULA AKSHATHA"],["160123737151","KANDHURI SAI RASAGNA"],["160123737152","MADATHANAPALLE LEENA"],["160123737153","M VEDA SRI"],["160123737154","M.PRAVALLIKA REDDY"],["160123737155","MANASA MORTHAD"],["160123737156","MIDDE JAHNAVI"],["160123737157","HARSHITHA"],["160123737158","POCHAMPELLY DEEKSHITHA"],["160123737159","PRIVANSHU NERELLA"],["160123737160","P.DHANUSHKA"],["160123737161","RIDA SHAIK"],["160123737162","SAMEEKSHA PADIGELAWAR"],["160123737163","SHRAVYA JALLEPALLY"],["160123737164","SISTLA KEERTHANA"],["160123737165","SRIIA SRIRAMDAS"],["160123737166","SURYAPETA SRAVANI"],["160123737167","SRICHANDANA"],["160123737168","AMBEER SHRAVAN KUMAR"],["160123737169","ASHISH PATHAK"],["160123737170","BAIRY SHIVA KARTHIK"],["160123737171","BANDARI LAKSHMANA PRASAD"],["160123737172","BATTPROLU SAI JEEVAN"],["160123737173","BHARGAV KOLLURU"],["160123737174","B. JAYANTH REDDY"],["160123737175","CH.SAI NITHIN REDDY"],["160123737176","HANOK KANNA"],["160123737177","D. RITHWIK MOHAN"],["160123737178","GARREPALLY RAMA RAGHAVA"],["160123737179","GODISHALA ASHWITH"],["160123737180","IMITSAL HUSSAIN RANGREZ"],["160123737181","JAKKU SANTHOSH REDDY"],["160123737182","KADIMI VENKATA SHASHANK YADAV"],["160123737183","K.RAJ GURU"],["160123737184","MOHIT NAREN"],["160123737185","VARUNDEEP REDDY KODURU"],["160123737186","KORPOLE KRISHNA KARTHIK REDDY"],["160123737187","KURUVELLA SAI BALAJI"],["160123737188","SATVIK REDDY"],["160123737189","SRUJAN NAYAK"],["160123737190","MANUVARTHI SESHADRI NAIDU"],["160123737191","MEHMOOD ALI"],["160123737192","MEKA VIRJ"],["160123737193","MELLAM ANISH"],["160123737194","MERUGU SAIKOUSHIK"],["160123737195","MOHAMMED FAIZAN UL ISLAM"],["160123737196","N S SASHANK EMMIDI"],["160123737197","NAGAM SRIVATSAV REDDY"],["160123737198","NIKHIL GEORGE"],["160123737199","PASHAM KARTHIK"],["160123737200","PATNALA ABINAYKUMAR"],["160123737201","ABHIRAM POLA"],["160123737202","RAHUL ARRA"],["160123737203","RAMAVATH NAVEEN"],["160123737204","SARIKELLA MADHU"],["160123737205","THODUPUNOORI SAI MANISH"],["160123737206","ROHIT THOTA"],["160123737207","VEDITH VANAM"],["160123737315","MALE VIGNESHWAR REDDY"],["160123737316","BORRA PUJITH GANESH"],["160123737317","NAGUNURI SHASHIDHAR"],["160123737318","BOBBALA VARSHINI"],["160123737319","AKBER HUSSAIN"],
  ],
  "B-2024-IT1": [
    ["160124737001","AMPALYAM KHYATHI"],["160124737002","ATIGADDA ABHINAYA"],["160124737003","BANOTHU MADHAVI"],["160124737004","BATTULA ANJALI"],["160124737005","BODIKELA ABHIGNYA"],["160124737006","CHITHULURI CHARISHMA"],["160124737007","HARI NIVEDITHA DHARMAGADDA"],["160124737008","DHARSHANAM CHANDANA"],["160124737009","GANGULA SRI KARTHIKA"],["160124737010","JANGA SNEHITHA"],["160124737011","JUTURI SHREEJA"],["160124737012","KAPARTHI ASRITHA"],["160124737013","KOMMIDI VAISHNAVI"],["160124737014","KULSUM ABID MOHIUDDIN"],["160124737015","MEGAVATH NANDINI"],["160124737016","MITTAKOLA VAMSHIKA"],["160124737017","M. NAYANALASYA"],["160124737018","N SUTHAN"],["160124737019","N. KHYATTI SHRE"],["160124737020","PAGIDIMARRI SREENIDHI"],["160124737021","PINJARI RESHMA SULTHANA"],["160124737022","PRAHARSHI SEPUR"],["160124737023","PRITIKA AGARWAL"],["160124737024","RAGASRI CHAMAKURI"],["160124737025","SRIVALLI RAPAKA"],["160124737026","SAHASTHRA JERIPOTULA"],["160124737027","DHANA SRI SOLI"],["160124737028","VISHWAJA NAKKA"],["160124737029","AARAADHYAA REDDY VANAMA"],["160124737030","BIIIMAVARAPU HEMANTH REDDY"],["160124737031","BRUGUMALLA GANESH GOUTHAM"],["160124737032","DEEPAK PRAJAPATI"],["160124737033","GS NISHANTH"],["160124737034","NIHAL GAJAM"],["160124737035","GUNJI PRADEEP"],["160124737036","JANAMMAGARI SAI KIRAN REDDY"],["160124737037","JANGILI SURYA TEJA"],["160124737038","JATOTH AKHIL"],["160124737039","JOEL THOMAS"],["160124737040","KAKI ABHISHEK"],["160124737041","KATAKAM SANTHOSH REDDY"],["160124737042","KOPPERA MITHUL REDDY"],["160124737043","KRISHNA TANAY CHOWDARY MALLINENI"],["160124737044","KUMAWAT ROHAN"],["160124737045","KUSUMBA SAI ABHINAV"],["160124737046","LOKASANI DILEEP REDDY"],["160124737047","MAJETI SHREERAM PHANEENDRA"],["160124737048","MEESALA PRABATH SATYA SAI VENKA"],["160124737049","MIYAPURAM DEEKSHITH"],["160124737050","MOHAMMAD IRFAN"],["160124737051","MOHAMMED IBRAHIM RASHEED"],["160124737052","KEVIN TEJAS NALLI"],["160124737053","NAMBURI VISHNU"],["160124737054","SOMASHEKAR PATNAM"],["160124737055","RAMAVATH KARTHIK"],["160124737056","RAMAVATH SAIKUMAR"],["160124737057","SHEELA RASHMITH"],["160124737058","SUJAL PRAKASH VUBA"],["160124737059","SURYA RUPESH KUMAR"],["160124737060","SYED SHAH KALEEMULLAH HUSSAINI"],["160124737061","V. SAI DEEPAK REDDY"],["160124737062","VEERNALA SHANMUKHA VARUN"],["160124737063","VIKAAS NALAJALA"],["160124737064","VISHWAK BODDUKURI"],["160124737065","V. ROHITH KUMAR REDDY"],["160124737301","P. DURGA PRASAD"],["160124737302","RAMULAPENTA RAMAKOTESH"],["160124737303","DUSA RAHUL"],["160124737304","NALLA PAVANKUMAR"],["160124737305","SYED MUBEEN"],["160124737306","ADE ASWITH"],
  ],
  "B-2024-IT2": [
    ["160124737071","ANNANYA REDDY KUCHIKULLA"],["160124737072","AZMEERA SREELEKHA"],["160124737073","AKSHARA"],["160124737074","B. BHAVITHA"],["160124737075","CHALLA PRAMODA"],["160124737076","DHARAVATH NAGESWARI"],["160124737077","DUDAPAKA RAVALI"],["160124737078","MOHINI JANGALA"],["160124737079","JANNU SHINY"],["160124737080","K. DEEKSHA REDDY"],["160124737081","KATTA AKSHITHA"],["160124737082","KOTIREDDY TEJITHA"],["160124737083","LAKSHMI SIRISHA"],["160124737084","KUSUMA SNITHIKA"],["160124737085","MANNE BHANU RITHVIKA"],["160124737086","MASNA HANSIKA"],["160124737087","P. SADHIKA"],["160124737088","R. BRINDHA SRI"],["160124737089","RAJULA GANGA SAMHITHA"],["160124737090","R. BHAVANI REDDY"],["160124737091","SIRI REDDY TADI"],["160124737092","SRUJANA TUNIKI"],["160124737093","VAINAVI VENKAT"],["160124737094","VAISHNAVI"],["160124737095","VIMMADISETTY NAGA SAI THANMAI"],["160124737096","A. RITHWIK BHUSHAN"],["160124737097","ABHINAV REGILLA"],["160124737098","ADDAGUDI SATHVIK"],["160124737099","A KOUSHIK REDDY"],["160124737100","VATHANREDDY"],["160124737101","B. JASWANTH REDDY"],["160124737102","C CHETANN REDDY"],["160124737103","CH. SAIRUTHIK"],["160124737104","GANGALA RESHIKESH YADAV"],["160124737105","G JASWANTH SAI KUMAR"],["160124737106","VIKRANTH JAKKOJU"],["160124737107","JAKKULA AYUSH PREETHAM"],["160124737108","JATAVATH RAJA"],["160124737109","JINAKA MANOJ KUMAR"],["160124737110","K R SREEMAN"],["160124737111","K VAMSHI CHANDRA REDDY"],["160124737112","KARAMPURI VISHNU TEJA"],["160124737113","NOT ASSIGNED"],["160124737114","KONNE BALRAJU"],["160124737115","REVANTH REDDY LINGALA"],["160124737116","MANISH SHAW"],["160124737117","MAVURU SAI KUSHAI"],["160124737118","MEKALA ANUDEEP"],["160124737119","MOHAMMED ABDUL RAQEEB"],["160124737120","NAGILA GOUTHAM"],["160124737121","NALLA ADHITYA"],["160124737122","SAIKIRAN"],["160124737123","NENAVATH NAVEEN"],["160124737124","NIRUPURI SRI KRISHNA"],["160124737125","PADIGELA SRUJAN"],["160124737126","P. RAJESHWAR GOUD"],["160124737127","JAYANTH PENDYALA"],["160124737128","R. SHASHVARDHAN REDDY"],["160124737129","SAARTHAK MANOCHA"],["160124737130","MADHU SANKU"],["160124737131","SURA SHRIRAM"],["160124737132","THATI VIGNESH"],["160124737133","T THANVITH"],["160124737134","V. ABHILASH"],["160124737135","YESWA PREETAM REDDY"],["160124737307","KAMANI SREEJA"],["160124737308","PUPPALA ANJALI"],["160124737309","MUKTAVARAPU SWAPNIKA"],["160124737310","KASARLA VIIITHA"],["160124737311","AVESHA IFRA"],["160124737312","KOMMU MAHESHWARI"],["160124737313","NEELAM JALAN REDDY"],
  ],
  "B-2024-IT3": [
    ["160124737141","HASINI ADAPALA"],["160124737142","AILAPURAM SAISHLOKA REDDY"],["160124737143","ANOUSHKA KARRA"],["160124737144","DAMODARA LAKSHMI MADHULIKA"],["160124737145","DOKUPARTHI SHRAVISTA"],["160124737146","D. SANJANA REDDY"],["160124737147","GUBBA SRI VIDYAMBIKA"],["160124737148","J P S ANANYA"],["160124737149","JHARANA PALAI"],["160124737150","AKSAH MALICAY"],["160124737151","HARSHITHA KATKURI"],["160124737152","KONDA HASINI"],["160124737153","MADIHA NAAZ"],["160124737154","NOT ASSIGNED"],["160124737155","RAFAH KHATOON"],["160124737156","SRINIDHI PASUPUNUTI"],["160124737157","PATLLOLA SRINIJA REDDY"],["160124737158","PRANATI PARANDKAR"],["160124737159","RAMANI ALA"],["160124737160","SIDDHI SHETKAR"],["160124737161","THOVITI SANKEERTHANA"],["160124737162","UDDANDAM TANVI"],["160124737163","ABINAV VANAM"],["160124737164","ADULAPURAM YUVAAN KAARTHIKEYA"],["160124737165","AITHA SHIVASAI"],["160124737166","AKELLA HARSHITH SAIPAAVAN"],["160124737167","B SHIVA PRASAD"],["160124737168","B DUURGAA PRASAD REDDY"],["160124737169","B. PRANAV NARAYANA"],["160124737170","BAVIKADI MOHASEEN HUSSAIN"],["160124737171","PAWANKUMAR"],["160124737172","CHILAKAMARRI SRISANTH"],["160124737173","GHULAM MUSTAFA"],["160124737174","GUGULOTH BHARATH"],["160124737175","G. REVANNATH"],["160124737176","K ASHOK"],["160124737177","KARLAPATI NANDU"],["160124737178","KARTHIK KALINADHABHATLA"],["160124737179","KATHI MUKESH REDDY"],["160124737180","KESHAVABAKTHULA SUJAL ROY"],["160124737181","KOLA VAMSHI GOUD"],["160124737182","KOMMU SRIMAN RAO"],["160124737183","K MINESH SRI RAM"],["160124737184","KOTRICA VIGNESH"],["160124737185","KOTTE SAI SHIVA VARMA"],["160124737186","M JAIDEV"],["160124737187","NIKHILMOCHI"],["160124737188","MAHIT HAZARI"],["160124737189","MACHUKONDA ANILKUMAR"],["160124737190","MOHAMMED ABDUL KHALIQ AMER"],["160124737191","VISHNU PERUMANDLA"],["160124737192","PONNA MANISH REDDY"],["160124737193","SAHAS REDDY BILLA"],["160124737194","SATRAM DEVAASHISH"],["160124737195","SENAPATI DEEPAK KUMAR"],["160124737196","SHAIK RAZA MOHAMMAD"],["160124737197","SRIRAMOUU UMESH"],["160124737198","SHASHANK SULUGANTI"],["160124737199","SYED SHAZ AHMED"],["160124737200","T YASHWANTH"],["160124737201","SHARATH"],["160124737202","TIPPAREDDY JUGAL KISHORE REDDY"],["160124737203","VADLAGATTA RAJANEESH NETHA"],["160124737204","VEMANA DEEKSHITH"],["160124737205","VIKHYATH JULURI"],["160124737206","M. SHYANTHAN REDDY"],["160124737314","KOTHURI GOUTHAM"],["160124737315","BANDIRALA LOHITHA"],["160124737316","MUGGU YASHAS"],["160124737317","PATHLAVATH RADHA RAO"],["160124737318","J ASHRITH VARDHAN"],["160124737319","PORTHETTI ARAVIND KUMAR"],
  ],
};

// ─── Deterministic PRNG so seeding is stable across reloads ─────────────────
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hashStr = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

// ─── Roll-number generation (matching college pattern) ──────────────────────
// Pattern: 160<batchYY>737<NNN>  e.g., 160123737071 for batch 2023, student 71
const buildRoll = (startYear, idx) => {
  const yy = String(startYear).slice(-2);
  return `160${yy}737${String(idx).padStart(3, "0")}`;
};

// ─── Current/most-recent semester per batch ─────────────────────────────────
// Batch 2023-2027 → in 2026-27 academic year, currently Semester 6
// Batch 2024-2028 → in 2026-27 academic year, currently Semester 4
const batchCurrentSemester = (startYear) => {
  // Assume current academic year is the 4th year of progress
  // 2023 batch: 2026-27 → Sem 6 (Spring of year 3)
  // 2024 batch: 2026-27 → Sem 4
  return startYear === 2023 ? 6 : 4;
};

// ─── Build seed: one IT department, two batches, three sections each ───────
function buildSeedStore() {
  const department = {
    id: 1,
    name: "Information Technology",
    abbreviation: "IT",
  };

  const batches = [
    { id: "B-2023", startYear: 2023, endYear: 2027, name: "2023-2027" },
    { id: "B-2024", startYear: 2024, endYear: 2028, name: "2024-2028" },
  ];

  const sections = [];
  const students = [];

  for (const batch of batches) {
    for (const secName of ["IT1", "IT2", "IT3"]) {
      const sectionId = `${batch.id}-${secName}`;
      const currentSem = batchCurrentSemester(batch.startYear);
      const roster = ROSTERS[sectionId] || [];
      const studentIds = [];
      roster.forEach(([rollNumber, name], i) => {
        const sid = `${sectionId}-${i + 1}`;
        studentIds.push(sid);
        students.push({
          id: sid,
          rollNumber,
          name,
          batchId: batch.id,
          sectionId,
          sectionName: secName,
        });
      });
      sections.push({
        id: sectionId,
        name: secName,
        batchId: batch.id,
        currentSemester: currentSem,
        studentIds,
      });
    }
  }

  // ── Random faculty ↔ subject ↔ section assignments ──
  // For each (batch, section, semester) we pick a curated subset of the
  // semester's catalogue: 4-6 theory subjects + 3-4 practical subjects.
  // Selection is deterministic per (batch, section, semester).
  const pickSubset = (pool, count, seedKey) => {
    const r = mulberry32(hashStr(seedKey));
    const arr = pool.slice();
    // Fisher–Yates with deterministic PRNG
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, Math.min(count, arr.length));
  };

  const assignments = [];
  for (const batch of batches) {
    const upToSem = batchCurrentSemester(batch.startYear);
    for (let sem = 1; sem <= upToSem; sem++) {
      const semSubs = SUBJECTS.filter((s) => s.semester === sem);
      const theoryPool = semSubs.filter((s) => s.type === "T");
      const labPool = semSubs.filter((s) => s.type === "P");
      const sectionsOfBatch = sections.filter((s) => s.batchId === batch.id);
      for (const sec of sectionsOfBatch) {
        const rSel = mulberry32(hashStr(`SEL|${batch.id}|${sec.id}|${sem}`));
        const theoryCount = 4 + Math.floor(rSel() * 3); // 4..6
        const labCount = 3 + Math.floor(rSel() * 2);    // 3..4
        const chosenTheory = pickSubset(theoryPool, theoryCount, `T|${batch.id}|${sec.id}|${sem}`);
        const chosenLab = pickSubset(labPool, labCount, `P|${batch.id}|${sec.id}|${sem}`);
        const chosen = [...chosenTheory, ...chosenLab];
        for (const sub of chosen) {
          const seed = hashStr(`${batch.id}|${sec.id}|${sub.code}|${sem}`);
          const rand = mulberry32(seed);
          const fac = FACULTY[Math.floor(rand() * FACULTY.length)];
          assignments.push({
            id: `A-${batch.id}-${sec.name}-${sub.code}`,
            facultyId: fac.id,
            subjectCode: sub.code,
            sectionId: sec.id,
            batchId: batch.id,
            semester: sem,
            academicYear:
              sem === upToSem
                ? "2026-27"
                : `${batch.startYear + Math.floor((sem - 1) / 2)}-${String(batch.startYear + Math.floor((sem - 1) / 2) + 1).slice(-2)}`,
            studentIds: sec.studentIds.slice(),
          });
        }
      }
    }
  }

  // ── Random CIE marks per (assignment, student) ──
  // Theory components: slipTests[3]/5, assignments[2]/10, classTests[2]/20, attendance/5
  // Lab components:    weeklyCIE[3]/30, internalTests[2]/20
  const marks = {};
  for (const a of assignments) {
    const sub = SUBJECTS.find((s) => s.code === a.subjectCode);
    const isTheory = sub.type === "T";
    for (const sid of a.studentIds) {
      const seed = hashStr(`${a.id}|${sid}`);
      const r = mulberry32(seed);
      const skill = 0.55 + r() * 0.4; // student ability 55-95%
      const noise = () => (r() - 0.5) * 0.2; // ±10%
      const pct = () => Math.max(0, Math.min(1, skill + noise()));

      let entry;
      if (isTheory) {
        entry = {
          slipTests: [Math.round(pct() * 5), Math.round(pct() * 5), Math.round(pct() * 5)],
          assignments: [Math.round(pct() * 10), Math.round(pct() * 10)],
          classTests: [Math.round(pct() * 20), Math.round(pct() * 20)],
          attendance: Math.round(pct() * 5),
        };
      } else {
        entry = {
          weeklyCIE: [Math.round(pct() * 30), Math.round(pct() * 30), Math.round(pct() * 30)],
          internalTests: [Math.round(pct() * 20), Math.round(pct() * 20)],
        };
      }
      marks[`${a.id}|${sid}`] = entry;
    }
  }

  return { department, batches, sections, students, faculty: FACULTY, subjects: SUBJECTS, assignments, marks };
}

// ─── Persistence ────────────────────────────────────────────────────────────
let _cache = null;
export function getStore() {
  if (_cache) return _cache;
  if (typeof window === "undefined") return buildSeedStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { _cache = JSON.parse(raw); return _cache; }
  } catch {}
  _cache = buildSeedStore();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_cache)); } catch {}
  return _cache;
}
export function saveStore(store) {
  _cache = store;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch {}
}
export function resetStore() {
  _cache = null;
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  return getStore();
}

// ─── CIE calculators (single source of truth) ──────────────────────────────
export const CIE_MAX_THEORY = 40;
export const CIE_MAX_LAB = 50;

export function computeTheoryCIE(m) {
  if (!m) return { slipTest: 0, assignment: 0, classTest: 0, attendance: 0, total: 0 };
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const slipTest = avg(m.slipTests || []);
  const assignment = avg(m.assignments || []);
  const classTest = avg(m.classTests || []);
  const attendance = m.attendance || 0;
  return {
    slipTest: Math.round(slipTest * 10) / 10,
    assignment: Math.round(assignment * 10) / 10,
    classTest: Math.round(classTest * 10) / 10,
    attendance,
    total: Math.round((slipTest + assignment + classTest + attendance) * 10) / 10,
  };
}
export function computeLabCIE(m) {
  if (!m) return { weeklyCIE: 0, internalTests: 0, total: 0 };
  const sum = (a) => (a || []).reduce((x, y) => x + y, 0);
  const weeklyCIE = sum(m.weeklyCIE);
  const internalTests = sum(m.internalTests);
  return { weeklyCIE, internalTests, total: weeklyCIE + internalTests };
}
export function computeCIETotal(subjectType, marks) {
  return subjectType === "T" ? computeTheoryCIE(marks).total : computeLabCIE(marks).total;
}

// ─── Selectors ──────────────────────────────────────────────────────────────
export function getSubject(code) {
  return getStore().subjects.find((s) => s.code === code);
}
export function getStudent(studentId) {
  return getStore().students.find((s) => s.id === studentId);
}
export function getSection(sectionId) {
  return getStore().sections.find((s) => s.id === sectionId);
}
export function getBatch(batchId) {
  return getStore().batches.find((b) => b.id === batchId);
}
export function getStudentsInSection(sectionId) {
  const store = getStore();
  return store.students.filter((st) => st.sectionId === sectionId);
}

// All assignments where a faculty teaches
export function getAssignmentsForFaculty(facultyId) {
  return getStore().assignments.filter((a) => a.facultyId === facultyId);
}
// All assignments for a section, optional semester filter
export function getAssignmentsForSection(sectionId, semester) {
  return getStore().assignments.filter(
    (a) => a.sectionId === sectionId && (semester == null || a.semester === semester),
  );
}
// All assignments a student is enrolled in (semester-filtered)
export function getAssignmentsForStudent(studentId, semester) {
  return getStore().assignments.filter(
    (a) =>
      a.studentIds.includes(studentId) &&
      (semester == null || a.semester === semester),
  );
}

export function getMarks(assignmentId, studentId) {
  return getStore().marks[`${assignmentId}|${studentId}`] || null;
}
export function setMarks(assignmentId, studentId, patch) {
  const store = getStore();
  const key = `${assignmentId}|${studentId}`;
  store.marks[key] = { ...(store.marks[key] || {}), ...patch };
  saveStore(store);
}

// Update a single assessment (e.g., classtest1) for many students at once.
// component examples: 'sliptest1' 'assignment2' 'classtest1' 'attendance'
//                     'weeklycie1' 'internaltest2'
export function updateAssessment(assignmentId, component, valuesByStudentId) {
  const store = getStore();
  for (const [sid, val] of Object.entries(valuesByStudentId)) {
    const key = `${assignmentId}|${sid}`;
    const m = store.marks[key] || {};
    const num = val === "" || val == null ? null : Number(val);
    if (component.startsWith("sliptest")) {
      const idx = parseInt(component.replace("sliptest", ""), 10) - 1;
      m.slipTests = m.slipTests ? [...m.slipTests] : [0, 0, 0];
      m.slipTests[idx] = num ?? 0;
    } else if (component.startsWith("assignment")) {
      const idx = parseInt(component.replace("assignment", ""), 10) - 1;
      m.assignments = m.assignments ? [...m.assignments] : [0, 0];
      m.assignments[idx] = num ?? 0;
    } else if (component.startsWith("classtest")) {
      const idx = parseInt(component.replace("classtest", ""), 10) - 1;
      m.classTests = m.classTests ? [...m.classTests] : [0, 0];
      m.classTests[idx] = num ?? 0;
    } else if (component === "attendance") {
      m.attendance = num ?? 0;
    } else if (component.startsWith("weeklycie")) {
      const idx = parseInt(component.replace("weeklycie", ""), 10) - 1;
      m.weeklyCIE = m.weeklyCIE ? [...m.weeklyCIE] : [0, 0, 0];
      m.weeklyCIE[idx] = num ?? 0;
    } else if (component.startsWith("internaltest")) {
      const idx = parseInt(component.replace("internaltest", ""), 10) - 1;
      m.internalTests = m.internalTests ? [...m.internalTests] : [0, 0];
      m.internalTests[idx] = num ?? 0;
    }
    store.marks[key] = m;
  }
  saveStore(store);
}

// Build the semesterData shape expected by Student dashboard / analytics
// for a given studentId.
export function buildStudentSemesterData(studentId) {
  const store = getStore();
  const result = {};
  for (let sem = 1; sem <= 8; sem++) {
    const myAssignments = store.assignments.filter(
      (a) => a.studentIds.includes(studentId) && a.semester === sem,
    );
    result[sem] = {
      subjects: myAssignments.map((a) => {
        const sub = store.subjects.find((s) => s.code === a.subjectCode);
        const m = store.marks[`${a.id}|${studentId}`] || {};
        const isTheory = sub.type === "T";
        return {
          courseCode: sub.code,
          name: sub.name,
          type: isTheory ? "theory" : "lab",
          credits: sub.credits,
          marks: isTheory
            ? {
                slipTests: m.slipTests || [0, 0, 0],
                assignments: m.assignments || [0, 0],
                classTests: m.classTests || [0, 0],
                attendance: m.attendance || 0,
              }
            : {
                weeklyCIE: m.weeklyCIE || [0, 0, 0],
                internalTests: m.internalTests || [0, 0],
              },
          grade: null,
          assignmentId: a.id,
          facultyId: a.facultyId,
        };
      }),
    };
  }
  return result;
}

// Default identity for demo logins
export const DEFAULT_FACULTY_ID = "IT01";
export function getDefaultStudentId() {
  // Pick first student of batch 2023, IT1
  const s = getStore().students.find((st) => st.sectionId === "B-2023-IT1");
  return s?.id;
}
