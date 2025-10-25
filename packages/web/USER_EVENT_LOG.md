To track user interactions like clicks, scrolling, and page visits on your website, you can use a **JavaScript snippet** that listens for these events and sends the data to your AWS Lambda endpoint (which logs the data to DynamoDB).

Below is a **ready-to-use JavaScript code** that you can add to your website. It tracks:
- **Page visits** (when the page loads)
- **Clicks** (on any element)
- **Scrolling** (percentage of page scrolled)

---

### **JavaScript Code for Tracking User Interactions**
```javascript
// Configuration: Replace with your AWS API Gateway endpoint
const API_ENDPOINT = 'YOUR_AWS_API_GATEWAY_ENDPOINT';

// Generate a unique session ID for each user visit
const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Function to send data to your backend
async function sendEvent(eventType, data = {}) {
  const eventData = {
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    event_type: eventType,
    page_url: window.location.href,
    ...data
  };

  try {
    await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
  } catch (error) {
    console.error('Error sending event:', error);
  }
}

// Track page visit
window.addEventListener('load', () => {
  sendEvent('page_visit');
});

// Track clicks on the entire document
document.addEventListener('click', (event) => {
  const target = event.target;
  const elementInfo = {
    tag_name: target.tagName,
    class_name: target.className,
    id: target.id,
    text: target.innerText.substring(0, 50) // Limit text length
  };
  sendEvent('click', elementInfo);
});

// Track scrolling: Send event every 25% of the page scrolled
let lastScrollPercent = 0;
window.addEventListener('scroll', () => {
  const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
  const roundedPercent = Math.floor(scrollPercent / 25) * 25;

  if (roundedPercent !== lastScrollPercent && roundedPercent <= 100) {
    sendEvent('scroll', { scroll_percent: roundedPercent });
    lastScrollPercent = roundedPercent;
  }
});
```

---

### **How to Use This Code**
1. **Replace `YOUR_AWS_API_GATEWAY_ENDPOINT`** with the URL of your AWS API Gateway endpoint (the one that triggers your Lambda function).
2. **Add this script** to your website, ideally in the `<head>` or just before the closing `</body>` tag.
3. **Test it** by opening your website, clicking around, and scrolling. Check your DynamoDB table to see if events are being logged.

---

### **What This Code Tracks**
| Event Type  | Data Collected                                                                 |
|-------------|--------------------------------------------------------------------------------|
| `page_visit`| Page URL, session ID, timestamp                                                |
| `click`      | Tag name, class, ID, and text of the clicked element, page URL, session ID    |
| `scroll`     | Scroll percentage (25%, 50%, 75%, 100%), page URL, session ID                 |

---

### **Example DynamoDB Item**
```json
{
  "session_id": "abc123xyz456",
  "timestamp": "2025-10-25T12:34:56.789Z",
  "event_type": "click",
  "page_url": "https://yourwebsite.com/page1",
  "tag_name": "BUTTON",
  "class_name": "like-button",
  "id": "like-btn-1",
  "text": "Like this post"
}
```
