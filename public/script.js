const output = (el, data) => {
  document.getElementById(el).textContent = JSON.stringify(data, null, 2);
};

document.getElementById('create-user').onclick = async () => {
  const name = document.getElementById('user-name').value;
  if (!name) return alert('Name is required');
  const res = await fetch('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  const data = await res.json();
  output('users-output', data);
};

document.getElementById('load-users').onclick = async () => {
  const res = await fetch('/users');
  const data = await res.json();
  output('users-output', data);
};

document.getElementById('send-message').onclick = async () => {
  const sender_id = document.getElementById('sender-id').value;
  const receiver_id = document.getElementById('receiver-id').value;
  const content = document.getElementById('message-content').value;
  if (!sender_id || !receiver_id || !content) return alert('All fields required');
  const res = await fetch('/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender_id, receiver_id, content })
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
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  const res = await fetch('/media', { method: 'POST', body: formData });
  const data = await res.json();
  output('media-output', data);
};

document.getElementById('load-media').onclick = async () => {
  const res = await fetch('/media');
  const data = await res.json();
  output('media-output', data);
};
