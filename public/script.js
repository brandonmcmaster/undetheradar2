let token = null;

const output = (el, data) => {
  document.getElementById(el).textContent = JSON.stringify(data, null, 2);
};

document.getElementById('register').onclick = async () => {
  const name = document.getElementById('reg-name').value;
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;
  if (!name || !username || !password) return alert('All fields required');
  const res = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, username, password })
  });
  const data = await res.json();
  if (data.token) token = data.token;
  document.getElementById('token-display').textContent = token || '';
  output('users-output', data);
};

document.getElementById('login').onclick = async () => {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  if (!username || !password) return alert('Both fields required');
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.token) token = data.token;
  document.getElementById('token-display').textContent = token || '';
  output('users-output', data);
};

document.getElementById('load-users').onclick = async () => {
  const res = await fetch('/users');
  const data = await res.json();
  output('users-output', data);
};

document.getElementById('send-message').onclick = async () => {
  const receiver_id = document.getElementById('receiver-id').value;
  const content = document.getElementById('message-content').value;
  if (!token) return alert('Login first');
  if (!receiver_id || !content) return alert('All fields required');
  const res = await fetch('/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ receiver_id, content })
  });
  const data = await res.json();
  output('messages-output', data);
};

document.getElementById('load-messages').onclick = async () => {
  const res = await fetch('/messages');
  const data = await res.json();
  output('messages-output', data);
};

document.getElementById('upload-media').onclick = async () => {
  const fileInput = document.getElementById('media-file');
  if (!fileInput.files[0]) return alert('File required');
  if (!token) return alert('Login first');
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  const res = await fetch('/media', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  const data = await res.json();
  output('media-output', data);
};

document.getElementById('load-media').onclick = async () => {
  const res = await fetch('/media');
  const data = await res.json();
  output('media-output', data);
};
