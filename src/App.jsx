import { useMemo, useState } from 'react';
import './App.css';

const categories = ['Personal', 'Work', 'Health', 'Study'];
const priorities = ['Low', 'Medium', 'High'];

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 10);
};

const initialReminders = [
  {
    id: createId(),
    title: 'Morning workout',
    description: '20-minute cardio session and stretching routine.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    category: 'Health',
    priority: 'High',
    completed: false,
    createdAt: new Date().toISOString(),
    isRecurring: true,
    recurringFrequency: 'daily',
    lastCompletedAt: null,
  },
  {
    id: createId(),
    title: 'Stand-up meeting',
    description: 'Share progress with the product squad.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    category: 'Work',
    priority: 'Medium',
    completed: false,
    createdAt: new Date().toISOString(),
    isRecurring: true,
    recurringFrequency: 'weekly',
    lastCompletedAt: null,
  },
  {
    id: createId(),
    title: 'Call mom',
    description: 'Catch up and plan the weekend dinner.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    category: 'Personal',
    priority: 'Low',
    completed: false,
    createdAt: new Date().toISOString(),
    isRecurring: false,
    recurringFrequency: 'none',
    lastCompletedAt: null,
  },
];

const priorityOrder = {
  High: 1,
  Medium: 2,
  Low: 3,
};

const frequencyLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const getNextDueDate = (isoString, frequency) => {
  const current = new Date(isoString);
  const next = new Date(current);

  switch (frequency) {
    case 'daily':
      next.setDate(current.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(current.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(current.getMonth() + 1);
      break;
    default:
      return isoString;
  }

  return next.toISOString();
};

const formatDateTime = (isoString) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getDueStatus = (isoString) => {
  const dueDate = new Date(isoString);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const absHours = Math.abs(diffHours);

  if (diffMs < 0) {
    const label = absHours >= 24
      ? `Trễ ${Math.round(absHours / 24)} ngày`
      : `Trễ ${absHours} giờ`;
    return { label, tone: 'overdue' };
  }

  if (diffHours <= 24) {
    const label = diffHours <= 1 ? 'Sắp đến hạn' : `Còn ${diffHours} giờ`;
    return { label, tone: 'soon' };
  }

  const diffDays = Math.round(diffHours / 24);
  return { label: `Còn ${diffDays} ngày`, tone: 'scheduled' };
};

function App() {
  const [reminders, setReminders] = useState(initialReminders);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    category: categories[0],
    priority: 'Medium',
    isRecurring: false,
    recurringFrequency: 'weekly',
  });
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    priority: 'all',
    status: 'all',
    sort: 'dueDate',
  });

  const stats = useMemo(() => {
    const total = reminders.length;
    const completed = reminders.filter((reminder) => !reminder.isRecurring && reminder.completed).length;
    const overdue = reminders.filter((reminder) => new Date(reminder.dueDate) < new Date()).length;
    const recurring = reminders.filter((reminder) => reminder.isRecurring).length;

    return { total, completed, overdue, recurring };
  }, [reminders]);

  const nextReminder = useMemo(() => {
    if (!reminders.length) return null;

    return [...reminders]
      .filter((reminder) => !reminder.completed)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  }, [reminders]);

  const filteredReminders = useMemo(() => {
    return reminders
      .filter((reminder) => {
        if (filters.category !== 'all' && reminder.category !== filters.category) {
          return false;
        }

        if (filters.priority !== 'all' && reminder.priority !== filters.priority) {
          return false;
        }

        if (filters.status !== 'all') {
          if (filters.status === 'completed' && !(reminder.completed && !reminder.isRecurring)) {
            return false;
          }

          if (filters.status === 'active' && reminder.completed && !reminder.isRecurring) {
            return false;
          }
        }

        if (!filters.search.trim()) {
          return true;
        }

        const query = filters.search.toLowerCase();
        return (
          reminder.title.toLowerCase().includes(query) ||
          reminder.description.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (filters.sort === 'priority') {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }

        if (filters.sort === 'createdAt') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }

        return new Date(a.dueDate) - new Date(b.dueDate);
      });
  }, [reminders, filters]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      category: categories[0],
      priority: 'Medium',
      isRecurring: false,
      recurringFrequency: 'weekly',
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.title.trim() || !formData.dueDate) {
      return;
    }

    const newReminder = {
      id: createId(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      dueDate: new Date(formData.dueDate).toISOString(),
      category: formData.category,
      priority: formData.priority,
      completed: false,
      createdAt: new Date().toISOString(),
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.isRecurring ? formData.recurringFrequency : 'none',
      lastCompletedAt: null,
    };

    setReminders((prev) => [newReminder, ...prev]);
    resetForm();
  };

  const handleComplete = (reminder) => {
    setReminders((prev) =>
      prev.map((item) => {
        if (item.id !== reminder.id) return item;

        if (item.isRecurring) {
          return {
            ...item,
            dueDate: getNextDueDate(item.dueDate, item.recurringFrequency),
            lastCompletedAt: new Date().toISOString(),
          };
        }

        const completed = !item.completed;
        return {
          ...item,
          completed,
          completedAt: completed ? new Date().toISOString() : null,
        };
      }),
    );
  };

  const handleSnooze = (reminderId, days = 1) => {
    setReminders((prev) =>
      prev.map((reminder) => {
        if (reminder.id !== reminderId) return reminder;

        const dueDate = new Date(reminder.dueDate);
        dueDate.setDate(dueDate.getDate() + days);

        return {
          ...reminder,
          dueDate: dueDate.toISOString(),
        };
      }),
    );
  };

  return (
    <div className="app">
      <div className="layout">
        <header className="hero">
          <h1>Smart Reminder</h1>
          <p>
            Theo dõi các việc cần làm, nhận thông báo khi sắp đến hạn và duy trì thói quen
            tốt với giao diện thân thiện trên mọi thiết bị.
          </p>

          {nextReminder ? (
            <div className="next-reminder">
              <span className="next-title">Việc tiếp theo</span>
              <strong>{nextReminder.title}</strong>
              <span>{formatDateTime(nextReminder.dueDate)}</span>
            </div>
          ) : (
            <div className="next-reminder empty">Chưa có nhắc nhở nào, hãy tạo ngay nhé!</div>
          )
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <span className="label">Tổng việc</span>
            <strong>{stats.total}</strong>
          </article>
          <article className="stat-card">
            <span className="label">Hoàn thành</span>
            <strong>{stats.completed}</strong>
          </article>
          <article className="stat-card">
            <span className="label">Đang lặp lại</span>
            <strong>{stats.recurring}</strong>
          </article>
          <article className="stat-card">
            <span className="label">Trễ hạn</span>
            <strong>{stats.overdue}</strong>
          </article>
        </section>

        <section className="card">
          <h2>Tạo nhắc nhở mới</h2>
          <form className="reminder-form" onSubmit={handleSubmit}>
            <label>
              Tiêu đề
              <input
                type="text"
                name="title"
                placeholder="Ví dụ: Uống 2 lít nước"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </label>

            <label className="full-width">
              Mô tả
              <textarea
                name="description"
                placeholder="Ghi chú thêm để nhớ kỹ hơn"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </label>

            <label>
              Thời gian
              <input
                type="datetime-local"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                required
              />
            </label>

            <label>
              Nhóm
              <select name="category" value={formData.category} onChange={handleInputChange}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Mức ưu tiên
              <select name="priority" value={formData.priority} onChange={handleInputChange}>
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>

            <label className="checkbox">
              <input
                type="checkbox"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={handleInputChange}
              />
              Lặp lại theo chu kỳ
            </label>

            {formData.isRecurring && (
              <label>
                Chu kỳ
                <select
                  name="recurringFrequency"
                  value={formData.recurringFrequency}
                  onChange={handleInputChange}
                >
                  {Object.entries(frequencyLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="form-actions">
              <button type="submit" className="primary">
                Lưu nhắc nhở
              </button>
              <button type="button" className="ghost" onClick={resetForm}>
                Xóa nhập liệu
              </button>
            </div>
          </form>
        </section>

        <section className="card filters">
          <h2>Bộ lọc</h2>
          <div className="filters-grid">
            <label>
              Tìm kiếm
              <input
                type="search"
                name="search"
                placeholder="Từ khóa..."
                value={filters.search}
                onChange={handleFilterChange}
              />
            </label>

            <label>
              Nhóm
              <select name="category" value={filters.category} onChange={handleFilterChange}>
                <option value="all">Tất cả</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Ưu tiên
              <select name="priority" value={filters.priority} onChange={handleFilterChange}>
                <option value="all">Tất cả</option>
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Trạng thái
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="all">Tất cả</option>
                <option value="active">Đang hoạt động</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </label>

            <label>
              Sắp xếp theo
              <select name="sort" value={filters.sort} onChange={handleFilterChange}>
                <option value="dueDate">Thời hạn</option>
                <option value="priority">Ưu tiên</option>
                <option value="createdAt">Ngày tạo</option>
              </select>
            </label>
          </div>
        </section>

        <section className="card reminder-list">
          <div className="list-header">
            <h2>Danh sách nhắc nhở</h2>
            <span>{filteredReminders.length} mục</span>
          </div>

          {filteredReminders.length === 0 ? (
            <p className="empty">Không tìm thấy nhắc nhở phù hợp.</p>
          ) : (
            <ul>
              {filteredReminders.map((reminder) => {
                const dueStatus = getDueStatus(reminder.dueDate);

                return (
                  <li key={reminder.id} className="reminder-item">
                    <div className="item-header">
                      <div>
                        <h3>{reminder.title}</h3>
                        <p className="description">{reminder.description || 'Không có ghi chú'}</p>
                      </div>
                      <div className="tags">
                        <span className={`tag priority-${reminder.priority.toLowerCase()}`}>
                          Ưu tiên: {reminder.priority}
                        </span>
                        <span className="tag category">{reminder.category}</span>
                        {reminder.isRecurring && (
                          <span className="tag recurring">Lặp: {frequencyLabels[reminder.recurringFrequency]}</span>
                        )}
                      </div>
                    </div>

                    <div className="item-footer">
                      <div className="time-info">
                        <span className={`status-tag ${dueStatus.tone}`}>{dueStatus.label}</span>
                        <span className="due">{formatDateTime(reminder.dueDate)}</span>
                        {reminder.lastCompletedAt && (
                          <span className="history">
                            Lần hoàn thành gần nhất: {formatDateTime(reminder.lastCompletedAt)}
                          </span>
                        )}
                        {reminder.completed && !reminder.isRecurring && reminder.completedAt && (
                          <span className="history">Đã hoàn thành: {formatDateTime(reminder.completedAt)}</span>
                        )}
                      </div>

                      <div className="actions">
                        <button
                          type="button"
                          className="primary"
                          onClick={() => handleComplete(reminder)}
                        >
                          {reminder.isRecurring
                            ? 'Ghi nhận đã làm'
                            : reminder.completed
                              ? 'Đánh dấu lại'
                              : 'Hoàn thành'}
                        </button>
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => handleSnooze(reminder.id)}
                        >
                          Hoãn 1 ngày
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
