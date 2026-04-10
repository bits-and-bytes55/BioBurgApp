import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema({
  questionIndex: Number,
  selected:      Number,  
  correct:       Boolean,
}, { _id: false });

const JobApplicationSchema = new mongoose.Schema(
  {
    fullName:          { type: String, required: true },
    email:             { type: String, required: true },
    phone:             { type: String, required: true },
    dateOfBirth:       { type: String },
    gender:            { type: String },
    address:           { type: String },
    city:              { type: String },
    state:             { type: String },
    pinCode:           { type: String },
    qualification:     { type: String },
    fieldOfStudy:      { type: String },
    workExperience:    { type: String },
    currentJobTitle:   { type: String },
    applyingFor:       { type: String, required: true },
    jobType:           { type: String },
    skills:            { type: String },
    preferredLocation: { type: String },
    expectedSalary:    { type: String },
    noticePeriod:      { type: String },
    linkedIn:          { type: String },
    coverLetter:       { type: String },
    resumeUrl:         { type: String },

    //  Legacy status 
    status: {
      type: String,
      enum: ["pending","reviewing","shortlisted","rejected","hired"],
      default: "pending",
    },

    //  6-stage pipeline 
    stage: {
      type: String,
      enum: ["application_filled","online_test","result","interview","offer_letter","joining"],
      default: "application_filled",
    },

    adminNote: { type: String, default: "" },

    //  Email log 
    emailsSent: [{
      stage:   String,
      sentAt:  { type: Date, default: Date.now },
      subject: String,
    }],

    //  Online Test 
    testToken:       { type: String, unique: true, sparse: true }, // UUID link token
    testSentAt:      { type: Date },
    testStartedAt:   { type: Date },
    testSubmittedAt: { type: Date },
    testDomain:      { type: String },
    testAnswers:     [AnswerSchema],
    testScore:       { type: Number },     
    testPassed:      { type: Boolean },
    testResult:      { type: String, enum: ["pass","fail","pending","not_sent"], default: "not_sent" },
    resultEmailSent: { type: Boolean, default: false },

    //  Interview 
    interviewLink:       { type: String },
    interviewScheduled:  { type: Date },
    interviewEmailSent:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("JobApplication", JobApplicationSchema);