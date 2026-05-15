import DeliveryAgent from "../models/DeliveryAgent.js";
import generateToken from "../utils/generateToken.js";
import EmployeeIDCard from "../models/employeeIdCards.js";

/* REGISTER  */
export const registerDeliveryAgent = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      vehicleType,
      assignedArea,
    } = req.body;

    const agentExists = await DeliveryAgent.findOne({
      email: email.toLowerCase(),
    });

    if (agentExists) {
      return res.status(400).json({
        success: false,
        message: "Delivery agent already exists",
      });
    }

    const agent = await DeliveryAgent.create({
      name,
      email,
      phone,
      password,
      vehicleType,
      assignedArea,
    });

    res.status(201).json({
      success: true,
      token: generateToken(agent._id, agent.role),
      data: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        vehicleType: agent.vehicleType,
        assignedArea: agent.assignedArea,
        role: agent.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* LOGIN  */
export const loginDeliveryAgent = async (req, res) => {
  try {
    const { email, password } = req.body;

    const agent = await DeliveryAgent.findOne({
      email: email.toLowerCase(),
    });

    if (!agent || !(await agent.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    res.status(200).json({
      success: true,
      token: generateToken(agent._id, agent.role),
      data: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        vehicleType: agent.vehicleType,
        assignedArea: agent.assignedArea,
        role: agent.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* PROFILE  */
export const getDeliveryAgentProfile = async (req, res) => {
  try {
    const agent = await DeliveryAgent.findById(req.user.id).select("-password");

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

        const idCard = await EmployeeIDCard.findOne({
      employeeRef: agent._id,
      sourceModel: "DeliveryAgent",
      isActive: true,
    }).sort({ issuedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...agent.toObject(),
        idCard,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
