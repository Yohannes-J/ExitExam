import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import FeedbackForm from '../components/FeedbackForm';

export default function StudentFeedback() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    category: 'bug',
    message: '',
    rating: 5,
  });
  const [newFeedbackAlert, setNewFeedbackAlert] = useState(0);
  const [previousFeedback, setPreviousFeedback] = useState([]);

  useEffect(() => {
    fetchFeedback();
    // Check for new responses every 10 seconds
    const interval = setInterval(checkForNewResponses, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await api.get('/feedback/student/my');
      setFeedback(res.data);
      setPreviousFeedback(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const checkForNewResponses = async () => {
    try {
      const res = await api.get('/feedback/student/my');
      // Find feedback items that NOW have a response but DIDN'T have one before
      const newResponses = res.data.filter(f => 
        f.adminResponse && 
        !previousFeedback.find(old => old._id === f._id && old.adminResponse)
      );
      
      if (newResponses.length > 0) {
        setNewFeedbackAlert(newResponses.length);
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Feedback Response', {
            body: `You have ${newResponses.length} new response(s) from admin`,
            icon: '💬'
          });
        }
      } else {
        // Clear alert if no new responses detected
        setNewFeedbackAlert(0);
      }
      
      // Always update the previous state for next check
      setPreviousFeedback(res.data);
      setFeedback(res.data);
    } catch (err) {
      console.error('Error checking for new responses:', err);
    }
  };

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    try {
      await api.delete(`/feedback/${id}`);
      setFeedback(feedback.filter(f => f._id !== id));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete feedback');
    }
  };

  const handleEditStart = (item) => {
    setEditingId(item._id);
    setEditFormData({
      category: item.category,
      message: item.message,
      rating: item.rating || 5,
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: name === 'rating' ? parseInt(value) : value });
  };

  const handleEditSubmit = async (id) => {
    if (!editFormData.title.trim() || !editFormData.message.trim()) {
      setError('Title and message are required');
      return;
    }

    try {
      const res = await api.put(`/feedback/${id}`, editFormData);
      setFeedback(feedback.map(f => f._id === id ? res.data.feedback : f));
      setEditingId(null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update feedback');
    }
  };

  const getCategoryIcon = (cat) => {
    const icons = { bug: '🐛', feature: '✨', ui: '🎨', performance: '⚡', other: '📝' };
    return icons[cat] || '📝';
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-yellow-100 text-yellow-800',
      read: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStars = (rating) => rating ? '⭐'.repeat(rating) : '';

  if (showForm) {
    return <FeedbackForm onSuccess={() => { setShowForm(false); fetchFeedback(); }} onCancel={() => setShowForm(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">My Feedback</h1>
            <p className="text-gray-600">View and manage your feedback submissions</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium whitespace-nowrap"
          >
            ✏️ Write Feedback
          </button>
        </div>

        {newFeedbackAlert > 0 && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
            <span>🔔 You have <strong>{newFeedbackAlert}</strong> new response(s) from admin!</span>
            <button onClick={() => setNewFeedbackAlert(0)} className="text-green-600 hover:text-green-800">✕</button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading your feedback...</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 text-lg mb-4">You haven't submitted any feedback yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Write Your First Feedback
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="p-4 sm:p-6">
                  {editingId === item._id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Feedback</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                          <select
                            name="category"
                            value={editFormData.category}
                            onChange={handleEditChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="bug">🐛 Bug Report</option>
                            <option value="feature">✨ Feature Request</option>
                            <option value="ui">🎨 UI/UX</option>
                            <option value="performance">⚡ Performance</option>
                            <option value="other">📝 Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                          <select
                            name="rating"
                            value={editFormData.rating}
                            onChange={handleEditChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="1">⭐ Poor</option>
                            <option value="2">⭐⭐ Fair</option>
                            <option value="3">⭐⭐⭐ Good</option>
                            <option value="4">⭐⭐⭐⭐ Very Good</option>
                            <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          name="message"
                          value={editFormData.message}
                          onChange={handleEditChange}
                          rows="4"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSubmit(item._id)}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 transition font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xl">{getCategoryIcon(item.category)}</span>
                            <span className="text-xs sm:text-sm px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium capitalize">{item.category}</span>
                            {item.rating && (
                              <span className="text-sm text-amber-600">{getStars(item.rating)}</span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Submitted on {new Date(item.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)} whitespace-nowrap`}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-3 rounded mb-3 border-l-4 border-blue-500">
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{item.message}</p>
                      </div>

                      {item.adminResponse ? (
                        <div className="bg-green-50 p-3 rounded border-l-4 border-green-500 mb-3">
                          <p className="text-xs text-gray-600 mb-2 font-medium">✅ Admin Response:</p>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">{item.adminResponse}</p>
                          {item.respondedBy && item.respondedAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              By {item.respondedBy.name} • {new Date(item.respondedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400 text-sm text-blue-800 mb-3">
                          ⏳ Waiting for admin response...
                        </div>
                      )}

                      {item.status === 'new' && (
                        <div className="flex gap-2 pt-3 border-t">
                          <button
                            onClick={() => handleEditStart(item)}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteFeedback(item._id)}
                            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
