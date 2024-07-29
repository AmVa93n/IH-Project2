const Notification = require('../models/Notification.model');
const { formatDistanceToNow } = require('date-fns');

module.exports = async (req, res, next) => {
    const user = req.session.currentUser
    if (user) {
      const notifications = await Notification.find({ target: user._id }).sort({ createdAt: -1 }).populate('source')
      notifications.forEach(notif => {
        switch(notif.type) {
            case "review": notif.newReview = true; break
            case "cancel": notif.cancelBooking = true; break
            case "booking": notif.newBooking = true; break
            case "message": notif.newMessage = true; break
            case "clone": notif.newClone = true; break
        }
        notif.timeDiff = formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })
      })
      res.locals.notifications = notifications;
      const unread = notifications.filter(n => !n.read).length
      res.locals.unread = unread;
    }
    next();
};