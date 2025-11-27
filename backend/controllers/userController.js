// @desc    Get current user's profile
// @route   GET /api/users/me
// @access  Private
export const getMe = async (req, res) => {
  // req.user is attached by the protect middleware
  const { employee_id, employee_name, role } = req.user;
  res.status(200).json({
    id: employee_id,
    name: employee_name,
    role: role,
  });
};
