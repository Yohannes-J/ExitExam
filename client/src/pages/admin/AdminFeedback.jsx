import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [respondingId, setRespondingId] = useState(null);

  useEffect(() => {
    fetchFeedback();
  }, [statusFilter, categoryFilter]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      
      const res = await api.get(`/feedback?${params.toString()}`);
      setFeedback(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/feedback/${id}`, { status: newStatus });
      setFeedback(feedback.map(f => f._id === id ? { ...f, status: newStatus } : f));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update feedback');
    }
  };

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    try {
      await api.delete(`/feedback/${id}`);
      setFeedback(feedback.filter(f => f._id !== id));
      setSelectedFeedback(null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete feedback');
    }
  };

  const handleSendResponse = async (id) => {
    if (!adminResponse.trim()) {
      setError('Response message cannot be empty');
      return;
    }

    try {
      await api.put(`/feedback/${id}`, { 
        adminResponse,
        status: 'resolved'
      });
      setFeedback(feedback.map(f => 
        f._id === id 
          ? { ...f, adminResponse, status: 'resolved', respondedAt: new Date() } 
          : f
      ));
      setAdminResponse('');
      setRespondingId(null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send response');
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

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Student Feedback</h1>
          <p className="text-gray-600">Manage and respond to student feedback</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="bug">🐛 Bug</option>
                <option value="feature">✨ Feature</option>
                <option value="ui">🎨 UI/UX</option>
                <option value="performance">⚡ Performance</option>
                <option value="other">📝 Other</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading feedback...</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 text-lg">No feedback found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xl">{getCategoryIcon(item.category)}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium capitalize">{item.category}</span>
                        {item.rating && (
                          <span className="text-sm text-amber-600">{getStars(item.rating)}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        From: <span className="font-medium">{item.studentName}</span> ({item.studentId?.studentId})
                      </p>
                      {item.studentEmail && (
                        <p className="text-sm text-gray-600">{item.studentEmail}</p>
                      )}
                    </div>
                    <div className="flex gap-2 items-start flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status.toUpperCase()}
                      </span>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item._id, e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none"
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded mb-4 border-l-4 border-blue-500">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{item.message}</p>
                  </div>

                  {item.adminResponse && (
                    <div className="bg-green-50 p-3 rounded mb-4 border-l-4 border-green-500">
                      <p className="text-xs text-gray-600 mb-1 font-medium">Admin Response:</p>
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">{item.adminResponse}</p>
                      {item.respondedBy && item.respondedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          By {item.respondedBy.name} • {new Date(item.respondedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedFeedback(selectedFeedback?._id === item._id ? null : item);
                        if (selectedFeedback?._id !== item._id) {
                          setAdminResponse('');
                          setRespondingId(null);
                        }
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {selectedFeedback?._id === item._id ? 'Close' : 'View Details'}
                    </button>
                    <button
                      onClick={() => handleDeleteFeedback(item._id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>

                  {selectedFeedback?._id === item._id && !item.adminResponse && (
                    <div className="mt-4 pt-4 border-t">
                      <textarea
                        value={respondingId === item._id ? adminResponse : ''}
                        onChange={(e) => {
                          setRespondingId(item._id);
                          setAdminResponse(e.target.value);
                        }}
                        onFocus={() => setRespondingId(item._id)}
                        placeholder="Type your response here..."
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      />
                      <button
                        onClick={() => handleSendResponse(item._id)}
                        disabled={!adminResponse.trim()}
                        className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition text-sm font-medium"
                      >
                        Send Response
                      </button>
                    </div>
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
