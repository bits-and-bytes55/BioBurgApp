import Consultation from "../models/Consultation.js";
import Patient from "../models/Patient.js";

/* consultations list for user */
export const getConsultations = async (req, res) => {
  const list = await Consultation.find({ user: req.user._id }).populate("patient");
  res.json(list);
};

export const addConsultation = async (req, res) => {
  const { question, patientId } = req.body;
  const c = await Consultation.create({ user: req.user._id, question, patient: patientId });
  res.status(201).json(c);
};

export const getPatients = async (req, res) => {
  const patients = await Patient.find({ user: req.user._id });
  res.json(patients);
};

export const addPatient = async (req, res) => {
  const p = await Patient.create({ user: req.user._id, ...req.body });
  res.status(201).json(p);
};

export const updatePatient = async (req, res) => {
  const p = await Patient.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
  res.json(p);
};
