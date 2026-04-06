import User from '../models/User.js'; // .js extension add karein aur check karein ki file ka naam 'UserModel.js' hai
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// --- 1. FORGOT PASSWORD (EMAIL BHEJNA) ---
// 'exports.forgotPassword' ko 'export const forgotPassword' se badlein
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // 1. User ko email se dhoondein
    const user = await User.findOne({ email });

    // Agar user nahi mila, tab bhi success message bhejें (Security reason)
    if (!user) {
      // Hum user ko nahi batate ki email exist nahi karta
      return res.json({ success: true, message: "Password reset link bhej diya gaya hai (agar email registered hai)." });
    }

    // 2. Ek unique reset token banayein
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // 3. Token ko HASH karke database mein save karein
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
      
    // 4. Token ki expiry set karein (15 minutes)
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; 

    await user.save();

    // 5. Frontend ka reset URL (Token ke saath)
    // !!! IMPORTANT !!! Yeh aapke FRONTEND app ka URL hona chahiye, backend (8000) ka nahi.
    // Agar aapka React app localhost:3000 par chal raha hai, toh yeh use karein:
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    // Agar Vite (port 5173) par hai, toh woh daalein.

    // 6. Email ka content
    const message = `
      <h1>Aapne password reset ke liye request kiya hai</h1>
      <p>Kripya naya password set karne ke liye is link par click karein:</p>
      <a href="${resetUrl}" target="_blank" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Your Password</a>
      <p>Yeh link sirf 15 minute ke liye valid hai.</p>
      <p>Agar aapne request nahi kiya hai, toh is email ko ignore karein.</p>
    `;

    // 7. Nodemailer se Email Bhejein
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Aap 'gmail' ya koi aur email service use kar sakte hain
      auth: {
        user: process.env.EMAIL_USER, // .env file se aayega
        pass: process.env.EMAIL_PASS, // .env file se aayega (Google App Password)
      },
    });

    // Email options
    const mailOptions = {
      from: `Your App Name <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request",
      html: message,
    };

    // Email bhejein
    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Password reset link bhej diya gaya hai." });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    // User ke token ko clear karein agar error aaye
    try {
        const userToUpdate = await User.findOne({ email });
        if (userToUpdate) {
            userToUpdate.resetPasswordToken = undefined;
            userToUpdate.resetPasswordExpire = undefined;
            await userToUpdate.save();
        }
    } catch (saveError) {
        console.error("Error clearing token after failed send:", saveError);
    }
    
    res.status(500).json({ success: false, message: "Email bhejte waqt error aaya." });
  }
};


// --- 2. RESET PASSWORD (NAYA PASSWORD SET KARNA) ---
// 'exports.resetPassword' ko 'export const resetPassword' se badlein
export const resetPassword = async (req, res) => {
  const { newPassword } = req.body;

  try {
    // 1. URL se token lein aur use HASH karein (DB se match karne ke liye)
    const resetToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // 2. User ko HASHED token se dhoondein aur check karein ki token expire toh nahi hua
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpire: { $gt: Date.now() }, // Check karein ki expiry time abhi se zyada ho
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Token invalid hai ya expire ho chuka hai." });
    }

    // 3. Naya password set karein
    // Naye password ko hash karein
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // 4. Token ko clear karein (taki dobara use na ho sake)
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ success: true, message: "Password successfully reset ho gaya hai! Ab aap login kar sakte hain." });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Password reset karne mein error aaya." });
  }
};