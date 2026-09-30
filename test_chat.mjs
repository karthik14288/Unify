async function testChat() {
  const res = await fetch('http://localhost:8080/api/chat', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer demo-test-token',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: 'What is causing the leaf yellowing in the north sector?',
      lens: 'Agriculture',
    }),
  });

  console.log('Chat Status:', res.status);
  const data = await res.json();
  console.log('Chat Response Answer:', data.answer);
}

testChat();
