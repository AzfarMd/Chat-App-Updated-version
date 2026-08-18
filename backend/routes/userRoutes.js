const express=require("express");
const router=express.Router()
const {registerUser,authUser,allUsers}=require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");
router.post('/', registerUser);
router.get('/', protect, allUsers);
router.route('/login').post(authUser)
module.exports=router;