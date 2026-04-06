// ─── mcqBank.js ───────────────────────────────────────────────────────────────
// 20-question MCQ banks by domain/role category.
// Each question: { q, options: [4 strings], answer: 0-3 (index) }

const BANKS = {

  // ── Sales & Marketing ──────────────────────────────────────────────────────
  sales: {
    label: "Sales & Marketing",
    questions: [
      { q: "What does CRM stand for?", options: ["Customer Relationship Management","Customer Revenue Model","Client Retention Marketing","Customer Reach Mechanism"], answer: 0 },
      { q: "Which metric measures the ratio of leads that become customers?", options: ["Churn Rate","Conversion Rate","NPS","ARPU"], answer: 1 },
      { q: "What is 'cold calling'?", options: ["Calling clients during winter","Calling prospects who have had no prior contact","Following up with existing clients","Calling leads who requested a callback"], answer: 1 },
      { q: "Which pricing strategy involves setting a high initial price then reducing it?", options: ["Penetration Pricing","Skimming Pricing","Bundle Pricing","Value Pricing"], answer: 1 },
      { q: "What is the sales funnel's last stage?", options: ["Awareness","Interest","Decision","Purchase/Action"], answer: 3 },
      { q: "USP stands for:", options: ["Unique Selling Point","Universal Sales Process","Unified Strategy Plan","User Satisfaction Parameter"], answer: 0 },
      { q: "Which technique involves understanding customer problems before pitching?", options: ["Hard Selling","SPIN Selling","Push Selling","Cold Pitching"], answer: 1 },
      { q: "B2B sales means:", options: ["Business to Buyer","Business to Business","Brand to Brand","Bulk to Buyer"], answer: 1 },
      { q: "A 'prospect' is:", options: ["An existing loyal customer","A potential customer who may be interested","A sales territory","A type of discount"], answer: 1 },
      { q: "Which of these is NOT a KPI for sales?", options: ["Deals Closed","Average Deal Size","Employee Satisfaction","Revenue Growth"], answer: 2 },
      { q: "What is upselling?", options: ["Convincing a customer to buy a cheaper product","Encouraging a customer to buy a more expensive or premium version","Selling in bulk","Offering discounts"], answer: 1 },
      { q: "Net Promoter Score (NPS) measures:", options: ["Employee productivity","Customer likelihood to recommend the company","Sales team performance","Market share"], answer: 1 },
      { q: "What is 'churn rate'?", options: ["Rate at which new customers are acquired","Rate at which customers stop doing business","Rate of product returns","Rate of employee turnover"], answer: 1 },
      { q: "Which channel is MOST effective for B2B lead generation?", options: ["Instagram","LinkedIn","TikTok","Snapchat"], answer: 1 },
      { q: "What does ROI stand for?", options: ["Return on Investment","Rate of Inquiry","Revenue on Inventory","Return of Interest"], answer: 0 },
      { q: "A 'sales quota' is:", options: ["Maximum allowed sales","A minimum sales target assigned to a rep","A discount ceiling","A territory boundary"], answer: 1 },
      { q: "Which is a key element of a sales pitch?", options: ["Reading from a script word for word","Highlighting product features only","Addressing customer pain points","Talking as fast as possible"], answer: 2 },
      { q: "What is 'pipeline management'?", options: ["Managing water supply for the company","Tracking and managing sales opportunities at various stages","Managing supply chain logistics","Managing IT pipelines"], answer: 1 },
      { q: "A follow-up email should be sent:", options: ["Never, wait for the prospect to contact you","Within 24–48 hours of a meeting or call","After 2 weeks only","Only if the prospect asks"], answer: 1 },
      { q: "Which skill is MOST important for a sales executive?", options: ["Technical coding","Active listening and communication","Graphic design","Financial accounting"], answer: 1 },
    ],
  },

  // ── Pharma / Medical Representative ───────────────────────────────────────
  pharma: {
    label: "Pharmaceutical & Medical",
    questions: [
      { q: "What does API stand for in pharmaceutical manufacturing?", options: ["Active Pharmaceutical Ingredient","Applied Production Index","Automated Process Integration","Active Product Interface"], answer: 0 },
      { q: "Which regulatory body approves drugs in India?", options: ["FSSAI","CDSCO","MCI","ICMR"], answer: 1 },
      { q: "What is a generic drug?", options: ["A drug sold without prescription","A drug that contains the same active ingredient as a brand-name drug","A drug made from natural herbs","A drug with no side effects"], answer: 1 },
      { q: "GMP stands for:", options: ["General Medical Practice","Good Manufacturing Practice","Government Medical Protocol","Generic Medicine Program"], answer: 1 },
      { q: "What is 'detailing' in pharma sales?", options: ["Writing chemical formulas","Presenting product information to healthcare professionals","Packaging medicines","Delivering medicines to hospitals"], answer: 1 },
      { q: "A Schedule H drug in India requires:", options: ["No prescription","A valid prescription from a licensed physician","Special government approval for each sale","Only a pharmacist's recommendation"], answer: 1 },
      { q: "What is the meaning of 'placebo'?", options: ["An inactive substance given instead of an active drug","A type of antibiotic","A vitamin supplement","A pain reliever"], answer: 0 },
      { q: "Which document accompanies medicine shipments to ensure traceability?", options: ["Purchase Order","Bill of Lading","Batch Manufacturing Record","Delivery Challan"], answer: 2 },
      { q: "Cold chain storage is critical for:", options: ["Surgical instruments","Temperature-sensitive vaccines and biologicals","All tablets","Paper documents"], answer: 1 },
      { q: "What is the Drugs and Cosmetics Act in India?", options: ["Act regulating cosmetics advertising","Legislation governing manufacture, sale, and import of drugs","Tax law for pharmaceutical companies","Hospital licensing regulations"], answer: 1 },
      { q: "MR in pharma stands for:", options: ["Medical Receptionist","Medical Representative","Medicine Reviewer","Market Researcher"], answer: 1 },
      { q: "Pharmacovigilance involves:", options: ["Marketing new drugs","Monitoring drug safety and adverse effects post-approval","Drug pricing regulation","Clinical trial recruitment"], answer: 1 },
      { q: "What is a drug's 'bioavailability'?", options: ["How expensive it is","The fraction that reaches systemic circulation unchanged","How quickly it's manufactured","Its shelf life"], answer: 1 },
      { q: "A 'formulary' in healthcare is:", options: ["A drug manufacturing recipe","A list of approved/preferred medications","A patient consent form","A billing system"], answer: 1 },
      { q: "Which route of administration has fastest drug action?", options: ["Oral","Topical","Intravenous","Sublingual"], answer: 2 },
      { q: "What is 'brand substitution' in pharmacy?", options: ["Replacing a branded drug with an equivalent generic","Creating a new brand name","Switching suppliers","Changing dosage forms"], answer: 0 },
      { q: "KYD in pharmaceutical context stands for:", options: ["Keep Your Distance","Know Your Doctor","Know Your Drug","Keep Your Data"], answer: 2 },
      { q: "Which skill is MOST important for a Medical Representative?", options: ["Advanced chemistry knowledge","Strong communication and relationship-building","Laboratory skills","Surgical techniques"], answer: 1 },
      { q: "A 'clinical trial' is conducted to:", options: ["Train doctors","Test safety and effectiveness of a new drug","Market existing drugs","Manufacture medicines"], answer: 1 },
      { q: "The expiry date on a drug indicates:", options: ["When it was manufactured","The date after which it may not be safe/effective","When to reorder","The last sale date"], answer: 1 },
    ],
  },

  // ── Operations & Logistics ────────────────────────────────────────────────
  operations: {
    label: "Operations & Logistics",
    questions: [
      { q: "What does SCM stand for?", options: ["Sales Control Management","Supply Chain Management","System Configuration Model","Standard Cost Metric"], answer: 1 },
      { q: "FIFO inventory method means:", options: ["First In, First Out","Fast Inventory For Operations","Final Invoice For Orders","Fixed Input Flow Output"], answer: 0 },
      { q: "What is a 'bottleneck' in operations?", options: ["A type of packaging","A process step that limits overall throughput","A vendor delay","An inventory error"], answer: 1 },
      { q: "KPI stands for:", options: ["Key Performance Indicator","Key Process Integration","Known Productivity Index","Key Planning Initiative"], answer: 0 },
      { q: "Just-in-Time (JIT) inventory means:", options: ["Keeping maximum stock always","Receiving goods only as needed for production","Ordering in bulk quarterly","Automated inventory ordering"], answer: 1 },
      { q: "What is 'lead time' in logistics?", options: ["The time from order placement to delivery","The time to train a new employee","The cost of shipping","The time to manufacture a product"], answer: 0 },
      { q: "A Warehouse Management System (WMS) is used to:", options: ["Manage HR records","Control and optimise warehouse operations","Track employee attendance","Handle customer complaints"], answer: 1 },
      { q: "What does ERP stand for?", options: ["Enterprise Resource Planning","Employee Retention Program","External Revenue Process","Equipment Repair Protocol"], answer: 0 },
      { q: "Which document is used to send goods from a warehouse?", options: ["Purchase Order","Invoice","Delivery Challan / Bill of Lading","Quotation"], answer: 2 },
      { q: "Safety stock is:", options: ["Stock stored in a secure vault","Extra inventory held to prevent stockouts","Defective items set aside","Stock owned by the safety team"], answer: 1 },
      { q: "What is '3PL'?", options: ["3rd Party Logistics","3 Product Lines","Third Profit Level","3 Phase Loading"], answer: 0 },
      { q: "Cycle counting in inventory means:", options: ["Counting all inventory once a year","Counting a subset of inventory regularly","Counting only damaged goods","Automated counting by robots"], answer: 1 },
      { q: "What is 'inbound logistics'?", options: ["Shipping products to customers","Receiving materials/goods into the business","Managing customer returns","International shipping"], answer: 1 },
      { q: "A Gantt chart is used for:", options: ["Financial reporting","Project scheduling and timeline tracking","Inventory management","Employee appraisal"], answer: 1 },
      { q: "Which metric measures warehouse efficiency?", options: ["NPS","Order Picking Accuracy","Churn Rate","Gross Margin"], answer: 1 },
      { q: "What is reverse logistics?", options: ["Delivering goods from overseas","Managing returns from customers back to the supplier","Backward scheduling","Unloading trucks"], answer: 1 },
      { q: "EOQ stands for:", options: ["End of Quarter","Economic Order Quantity","Estimated Output Quality","External Order Queue"], answer: 1 },
      { q: "What is a Bill of Materials (BOM)?", options: ["Monthly invoice","List of raw materials needed to manufacture a product","Shipping documents","Employee task list"], answer: 1 },
      { q: "Which is NOT a type of inventory?", options: ["Raw Materials","Work-in-Progress","Finished Goods","Operational Budget"], answer: 3 },
      { q: "What does SLA stand for in operations?", options: ["Standard Logistic Approach","Service Level Agreement","Stock Level Assessment","System Launch Activity"], answer: 1 },
    ],
  },

  // ── IT & Technology ───────────────────────────────────────────────────────
  it: {
    label: "IT & Technology",
    questions: [
      { q: "What does HTML stand for?", options: ["HyperText Markup Language","High Transfer Markup Logic","HyperText Management Language","Hybrid Text Modelling Logic"], answer: 0 },
      { q: "What is an IP address?", options: ["Internet Provider Address","A unique numerical identifier for a device on a network","An internal post address","An International Protocol Address"], answer: 1 },
      { q: "What does SQL stand for?", options: ["System Query Language","Structured Query Language","Standard Queue Language","Sequential Query Logic"], answer: 1 },
      { q: "RAM stands for:", options: ["Random Access Memory","Read And Modify","Remote Access Mode","Read Allowed Memory"], answer: 0 },
      { q: "What is the purpose of a firewall?", options: ["To speed up internet","To prevent unauthorised access to a network","To store data","To connect networks globally"], answer: 1 },
      { q: "What is cloud computing?", options: ["Storing data on local hard drives","Delivering computing services over the internet","Using desktop computers only","Weather forecasting using computers"], answer: 1 },
      { q: "Which protocol is used for secure web browsing?", options: ["HTTP","FTP","HTTPS","SMTP"], answer: 2 },
      { q: "What is a VPN?", options: ["Virtual Private Network","Very Personal Network","Verified Public Node","Virtual Protocol Number"], answer: 0 },
      { q: "What is 'phishing'?", options: ["A type of software update","A cyber attack using deceptive emails/sites to steal credentials","A network speed test","A type of encryption"], answer: 1 },
      { q: "Which is a NoSQL database?", options: ["MySQL","PostgreSQL","MongoDB","Oracle"], answer: 2 },
      { q: "What does API mean?", options: ["Application Programming Interface","Automated Process Integration","Applied Protocol Index","Application Process Input"], answer: 0 },
      { q: "What is version control used for?", options: ["Pricing software versions","Tracking and managing code changes over time","Controlling user access","Managing database versions"], answer: 1 },
      { q: "Which is an operating system?", options: ["Google Chrome","Microsoft Excel","Ubuntu Linux","Apache HTTP Server"], answer: 2 },
      { q: "What does CPU stand for?", options: ["Central Processing Unit","Computer Peripheral Unit","Core Processing Utility","Central Program Upload"], answer: 0 },
      { q: "What is 'responsive web design'?", options: ["A site that loads faster","A design that adapts to different screen sizes","A design with animations","A site with quick response support"], answer: 1 },
      { q: "Which language is primarily used for data analysis?", options: ["Java","Python","HTML","Assembly"], answer: 1 },
      { q: "What does DNS stand for?", options: ["Data Network System","Domain Name System","Digital Node Server","Data Naming Service"], answer: 1 },
      { q: "What is two-factor authentication (2FA)?", options: ["Using two passwords","A security process requiring two forms of verification","Having two admin accounts","Logging in from two devices"], answer: 1 },
      { q: "Agile methodology is used in:", options: ["Financial accounting","Software development project management","Hardware manufacturing","Database administration"], answer: 1 },
      { q: "What is a 'server'?", options: ["A waiter at a restaurant","A computer that provides services/resources to other computers","A type of cable","A network switch"], answer: 1 },
    ],
  },

  // ── HR & Administration ───────────────────────────────────────────────────
  hr: {
    label: "HR & Administration",
    questions: [
      { q: "What does JD stand for in HR?", options: ["Job Description","Junior Director","Job Designation","Job Division"], answer: 0 },
      { q: "What is 'attrition' in HR?", options: ["Hiring new employees","Rate at which employees leave an organisation","Performance appraisal process","Training programmes"], answer: 1 },
      { q: "KRA stands for:", options: ["Key Recruitment Activity","Key Result Area","Known Resource Allocation","Key Responsibility Assessment"], answer: 1 },
      { q: "What is an 'exit interview'?", options: ["Interview to hire a replacement","Interview conducted when an employee leaves","First interview for a candidate","Interview for a promotion"], answer: 1 },
      { q: "Gratuity in India is payable after:", options: ["1 year of service","3 years of service","5 years of continuous service","10 years of service"], answer: 2 },
      { q: "What is 'onboarding'?", options: ["Offboarding employees","Process of integrating a new hire into the organisation","Performance review","Employee training for seniors"], answer: 1 },
      { q: "PF in India stands for:", options: ["Personal Fund","Provident Fund","Pension Finance","Payroll Formula"], answer: 1 },
      { q: "What is a 'competency'?", options: ["A company policy","A measurable ability, skill, or knowledge required for a role","An employee benefit","A type of contract"], answer: 1 },
      { q: "Which law governs minimum wages in India?", options: ["Payment of Gratuity Act","Minimum Wages Act 1948","Industrial Disputes Act","Contract Labour Act"], answer: 1 },
      { q: "360-degree feedback means:", options: ["Annual performance review by manager only","Feedback collected from all directions — peers, subordinates, managers","Self-assessment only","Customer satisfaction survey"], answer: 1 },
      { q: "What is 'talent acquisition'?", options: ["Buying a company","Strategic process of identifying and hiring skilled candidates","Training existing employees","Managing employee benefits"], answer: 1 },
      { q: "HRIS stands for:", options: ["Human Resource Information System","HR Internal Service","Human Resource Integration Software","HR Incentive System"], answer: 0 },
      { q: "What is a 'bell curve' in performance management?", options: ["A type of salary structure","A normal distribution used to rate employee performance","A recruitment tool","An attrition model"], answer: 1 },
      { q: "ESI in India provides:", options: ["Employment Subsidy Insurance","Employee State Insurance — health/social security","Executive Salary Increment","Employee Skill Index"], answer: 1 },
      { q: "What is the purpose of a job analysis?", options: ["To advertise a vacancy","To determine duties, skills and requirements of a role","To conduct interviews","To calculate salary"], answer: 1 },
      { q: "What does 'diversity & inclusion' mean in HR?", options: ["Hiring only from one group","Ensuring varied backgrounds and creating an equitable workplace","Diversity of products","Inclusion in training"], answer: 1 },
      { q: "Notice period is:", options: ["Time between two jobs","Period an employee must work after resignation before leaving","Probation period","Annual leave notice"], answer: 1 },
      { q: "What is payroll processing?", options: ["Hiring candidates","Calculating and distributing employee salaries and deductions","Performance evaluation","Office administration"], answer: 1 },
      { q: "An NDA in employment is:", options: ["National Development Agreement","Non-Disclosure Agreement preventing sharing of confidential information","New Department Allocation","Network Data Agreement"], answer: 1 },
      { q: "What is 'succession planning'?", options: ["Planning company merger","Identifying and developing future leaders for key roles","Managing customer succession","Planning production shifts"], answer: 1 },
    ],
  },

  // ── Data & Analytics ──────────────────────────────────────────────────────
  data: {
    label: "Data & Analytics",
    questions: [
      { q: "What is a 'data lake'?", options: ["A database for small datasets","A large repository storing raw data in native format","A type of data visualisation","A backup system"], answer: 1 },
      { q: "Which chart is best for showing trends over time?", options: ["Pie Chart","Bar Chart","Line Chart","Scatter Plot"], answer: 2 },
      { q: "What does ETL stand for?", options: ["Extract, Transform, Load","External Transfer Layer","Enterprise Technology Logic","Estimated Total Load"], answer: 0 },
      { q: "What is 'data cleaning'?", options: ["Deleting old data","Detecting and correcting errors/inconsistencies in data","Encrypting data","Archiving data"], answer: 1 },
      { q: "Which tool is widely used for data visualisation?", options: ["Microsoft Word","Tableau","Photoshop","AutoCAD"], answer: 1 },
      { q: "What is a KPI dashboard?", options: ["A project management tool","Visual display of key metrics and performance indicators","Employee attendance system","Financial audit report"], answer: 1 },
      { q: "What is 'regression analysis'?", options: ["Reducing data size","Statistical method examining relationships between variables","A data backup technique","A chart type"], answer: 1 },
      { q: "What does BI stand for?", options: ["Business Intelligence","Binary Input","Business Integration","Base Index"], answer: 0 },
      { q: "What is a 'pivot table'?", options: ["A table that rotates","A data summarisation tool in spreadsheets","A type of chart","A database query"], answer: 1 },
      { q: "Big Data is characterised by which '3 Vs'?", options: ["Volume, Velocity, Variety","Value, Vision, Volume","Validity, Velocity, Value","Volume, Visibility, Velocity"], answer: 0 },
      { q: "What is 'mean' in statistics?", options: ["The middle value","The most frequent value","The average of all values","The range of values"], answer: 2 },
      { q: "Which language is most used in data science?", options: ["Java","PHP","Python","Ruby"], answer: 2 },
      { q: "What is 'data governance'?", options: ["Government control of data","Policies and standards for data management in an organisation","Data encryption methods","Database software"], answer: 1 },
      { q: "An outlier in a dataset is:", options: ["The average value","A data point significantly different from others","A missing value","A duplicate entry"], answer: 1 },
      { q: "What is 'real-time analytics'?", options: ["Historical data analysis","Analysis performed as data arrives, with minimal delay","Yearly data reviews","Offline data processing"], answer: 1 },
      { q: "What does SQL SELECT statement do?", options: ["Deletes records","Updates records","Retrieves data from a database","Creates a new table"], answer: 2 },
      { q: "What is 'data normalisation'?", options: ["Making all data the same","Organising a database to reduce redundancy","Encrypting data","Converting data to PDF"], answer: 1 },
      { q: "A 'heat map' in data visualisation shows:", options: ["Temperature data only","Magnitude of values using colour intensity","Time series data","Network connections"], answer: 1 },
      { q: "What is 'A/B testing'?", options: ["Testing two products in a lab","Comparing two versions of something to see which performs better","Academic and business comparison","Alpha and Beta software testing"], answer: 1 },
      { q: "What does 'data-driven decision making' mean?", options: ["Making decisions based on gut feeling","Using data and analytics to guide business decisions","Collecting data without purpose","Delegating decisions to IT"], answer: 1 },
    ],
  },

  // ── General / Default ─────────────────────────────────────────────────────
  general: {
    label: "General Aptitude",
    questions: [
      { q: "If a product costs ₹500 and is marked up by 20%, what is the selling price?", options: ["₹520","₹580","₹600","₹620"], answer: 2 },
      { q: "What does 'professionalism' in a workplace mean?", options: ["Wearing expensive clothes","Behaving with integrity, responsibility and respect","Working overtime always","Socialising with management"], answer: 1 },
      { q: "Which communication skill is MOST important at work?", options: ["Speaking only when spoken to","Sending long emails","Active listening and clear expression","Avoiding all feedback"], answer: 2 },
      { q: "If a train covers 300 km in 4 hours, its speed is:", options: ["60 km/h","65 km/h","75 km/h","80 km/h"], answer: 2 },
      { q: "Time management primarily involves:", options: ["Working as fast as possible","Prioritising tasks and using time effectively","Delegating all work","Avoiding long tasks"], answer: 1 },
      { q: "Which of these is an example of teamwork?", options: ["Completing a project alone","Sharing credit only with your friends","Collaborating to solve a problem despite disagreements","Reporting colleagues' mistakes to management"], answer: 2 },
      { q: "What is the meaning of 'deadline'?", options: ["End of a working day","The latest time/date by which a task must be completed","A dangerous line in a factory","A line in a contract"], answer: 1 },
      { q: "20% of 350 is:", options: ["60","65","70","75"], answer: 2 },
      { q: "An 'agenda' for a meeting is:", options: ["Minutes of the meeting","A list of topics to be discussed","An attendance sheet","A summary of decisions"], answer: 1 },
      { q: "If you disagree with your manager's decision, the BEST approach is to:", options: ["Ignore it silently","Discuss it respectfully in private","Complain to colleagues","Refuse to follow it"], answer: 1 },
      { q: "Which is a sign of good work ethics?", options: ["Coming late occasionally","Doing only the minimum required","Taking ownership and responsibility for your work","Avoiding challenging tasks"], answer: 2 },
      { q: "What does 'escalation' mean in a professional context?", options: ["Increasing salary","Raising an issue to a higher authority for resolution","Expanding a project","Increasing workload"], answer: 1 },
      { q: "A 'target market' is:", options: ["A specific group of customers a business aims to serve","A store selling all products","A sales territory","All people who could buy a product"], answer: 0 },
      { q: "Find the missing number: 2, 6, 18, 54, ?", options: ["108","126","162","216"], answer: 2 },
      { q: "Confidentiality at work means:", options: ["Sharing information with trusted friends outside the company","Keeping sensitive company and client information private","Publishing work on social media","Discussing only with your team"], answer: 1 },
      { q: "Which is the BEST way to handle a complaint from a client?", options: ["Deny responsibility","Listen carefully, apologise, and resolve promptly","Transfer them to another department immediately","Tell them to complain in writing only"], answer: 1 },
      { q: "What does 'ROI' mean in a business context?", options: ["Return on Investment","Range of Inventory","Rate of Interest","Revenue on Invoice"], answer: 0 },
      { q: "If a task takes 3 hours and you have 2 people working on it together, how long will it take?", options: ["1 hour","1.5 hours","2 hours","2.5 hours"], answer: 1 },
      { q: "Professional email etiquette includes:", options: ["Using all caps for emphasis","Writing a clear subject line and greeting","Forwarding all emails without reading","Replying only when convenient"], answer: 1 },
      { q: "The primary goal of customer service is:", options: ["Selling more products","Resolving issues as slowly as possible","Meeting and exceeding customer expectations","Collecting customer data"], answer: 2 },
    ],
  },
};

// ── Domain mapper ─────────────────────────────────────────────────────────────
// Maps job role keywords → question bank key
const DOMAIN_MAP = [
  { keys: ["sales","marketing","business development","account manager","bdm","bde"], bank: "sales" },
  { keys: ["pharma","medical","representative","mr","lab","nursing","paramedic","pharmacist"], bank: "pharma" },
  { keys: ["operations","logistics","warehouse","supply","fleet","driver","delivery"], bank: "operations" },
  { keys: ["it","software","tech","data analyst","cyber","developer","support engineer"], bank: "it" },
  { keys: ["hr","human resource","recruitment","talent","training","payroll"], bank: "hr" },
  { keys: ["data","analytics","analyst","bi","intelligence","insights"], bank: "data" },
];

export const getDomainForRole = (role = "", skills = "") => {
  const text = `${role} ${skills}`.toLowerCase();
  for (const { keys, bank } of DOMAIN_MAP) {
    if (keys.some(k => text.includes(k))) return bank;
  }
  return "general";
};

// Returns 20 shuffled questions for a domain
export const getQuestionsForDomain = (domain) => {
  const bank = BANKS[domain] || BANKS.general;
  // shuffle and return all 20
  return [...bank.questions].sort(() => Math.random() - 0.5);
};

export const DOMAIN_LABELS = Object.fromEntries(
  Object.entries(BANKS).map(([k, v]) => [k, v.label])
);

export default BANKS;