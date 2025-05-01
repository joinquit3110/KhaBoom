import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const CourseView = () => {
  const { courseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi there! I\'m your learning assistant. Ask me anything about this course!' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // Mock course data - in a real app this would come from an API
  useEffect(() => {
    // Simulating API request
    setTimeout(() => {
      const courseData = {
        id: courseId,
        title: getCourseTitle(courseId),
        description: getCourseDescription(courseId),
        sections: getCourseSections(courseId),
        color: getCourseColor(courseId)
      };
      setCourse(courseData);
      setLoading(false);
    }, 800);
  }, [courseId]);

  const getCourseTitle = (id) => {
    const titles = {
      'circles': 'Circles and Pi',
      'graph-theory': 'Graph Theory',
      'probability': 'Probability',
      'codes': 'Coding Theory',
      'divisibility': 'Divisibility',
      'polyhedra': 'Polyhedra',
      'fractals': 'Fractals',
      'triangles': 'Triangles'
    };
    return titles[id] || 'Course';
  };

  const getCourseDescription = (id) => {
    const descriptions = {
      'circles': 'Learn about circles, their properties, and the significance of Pi in mathematics.',
      'graph-theory': 'Explore the mathematical structures used to model relations between objects.',
      'probability': 'Understand the mathematics of chance and uncertainty.',
      'codes': 'Learn about error detection and correction in data transmission.',
      'divisibility': 'Understand division and remainders in number theory.',
      'polyhedra': 'Discover the fascinating world of 3D geometric shapes.',
      'fractals': 'Explore the beauty of self-similar patterns in mathematics.',
      'triangles': 'Learn about the fundamental shape in geometry.'
    };
    return descriptions[id] || 'An interactive course on mathematics.';
  };

  const getCourseColor = (id) => {
    const colors = {
      'circles': '#5A49C9',
      'graph-theory': '#4DB94B',
      'probability': '#F7672C',
      'codes': '#1094BC',
      'divisibility': '#E91E63',
      'polyhedra': '#FF9800',
      'fractals': '#9C27B0',
      'triangles': '#00BCD4'
    };
    return colors[id] || '#333333';
  };

  const getCourseSections = (id) => {
    // Mock sections for the course - in a real app, this would come from backend
    if (id === 'circles') {
      return [
        {
          title: 'Introduction',
          content: `<p>For as long as humans have existed, we have looked to the sky and tried to explain life on Earth using the motion of stars, planets and the moon.</p>
                    <p>Ancient Greek astronomers were the first to discover that all celestial objects move on regular paths, called <strong>orbits</strong>. They believed that these orbits are always circular. After all, circles are the "most perfect" of all shapes: symmetric in every direction, and thus a fitting choice for the underlying order of our universe.</p>
                    <div class="interactive-element">
                      <div class="interactive-placeholder">
                        <img src="/images/circles-intro.jpg" alt="Earth at the center of the Ptolemaic universe" />
                        <p class="caption">Earth is at the center of the <em>Ptolemaic universe</em>.</p>
                      </div>
                    </div>`
        },
        {
          title: 'Circle Properties',
          content: `<p>Every point on a <strong>circle</strong> has the same distance from its center. This means that they can be drawn using a compass.</p>
                    <p>There are three important measurements related to circles that you need to know:</p>
                    <ul>
                      <li>The <strong>radius</strong> is the distance from the center of a circle to its outer rim.</li>
                      <li>The <strong>diameter</strong> is the distance between two opposite points on a circle. It goes through its center, and its length is twice the radius.</li>
                      <li>The <strong>circumference</strong> (or perimeter) is the distance around a circle.</li>
                    </ul>
                    <div class="interactive-element">
                      <div class="interactive-placeholder">
                        <p>Interactive compass demonstration would appear here in the full version.</p>
                      </div>
                    </div>`
        },
        {
          title: 'Pi and Circumference',
          content: `<p>You might remember that, for similar polygons, the ratio between corresponding sides is always constant. Something similar works for circles: the ratio between the <strong>circumference</strong> and the <strong>diameter</strong> is equal for <em>all circles</em>. It is always 3.14159… – a mysterious number called <strong>Pi</strong>, which is often written as the Greek letter π for "p". Pi has infinitely many decimal digits that go on forever without any specific pattern.</p>
                    <p>For a circle with diameter <em>d</em>, the circumference is <strong>C = π × d</strong>. Similarly, for a circle with radius <em>r</em>, the circumference is <strong>C = 2 π r</strong>.</p>
                    <div class="interactive-element">
                      <div class="interactive-placeholder">
                        <p>Interactive Pi visualization would appear here in the full version.</p>
                      </div>
                    </div>`
        },
        {
          title: 'Circles in Nature',
          content: `<p>Circles are perfectly symmetric, and they don't have any "weak points" like the corners of a polygon. This is one of the reasons why they can be found everywhere in nature:</p>
                    <div class="image-grid">
                      <div>
                        <img src="/images/circles-flower.jpg" alt="Flower" />
                        <p>Flowers</p>
                      </div>
                      <div>
                        <img src="/images/circles-earth.jpg" alt="Earth" />
                        <p>Planets</p>
                      </div>
                      <div>
                        <img src="/images/circles-ripples.jpg" alt="Ripples" />
                        <p>Ripples</p>
                      </div>
                    </div>`
        }
      ];
    } else {
      // Default sections for other courses
      return [
        {
          title: 'Introduction',
          content: `<p>Welcome to the ${getCourseTitle(id)} course. This is an interactive learning experience where you'll discover fascinating concepts through interactive examples and visualizations.</p>
                    <p>This is a placeholder for the full interactive course content.</p>`
        },
        {
          title: 'Basic Concepts',
          content: `<p>In this section, you would learn the fundamental concepts of ${getCourseTitle(id)}.</p>
                    <p>The interactive elements would allow you to experiment with these concepts directly.</p>
                    <div class="interactive-element">
                      <div class="interactive-placeholder">
                        <p>Interactive demonstration would appear here in the full version.</p>
                      </div>
                    </div>`
        },
        {
          title: 'Advanced Applications',
          content: `<p>Here you would explore more advanced applications of ${getCourseTitle(id)}.</p>
                    <p>The interactive elements would allow you to see complex examples and solve challenging problems.</p>`
        }
      ];
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Add the user message
    setMessages([...messages, { sender: 'user', text: newMessage }]);
    
    // Generate bot response
    setTimeout(() => {
      const botResponses = [
        `That's a great question about ${course.title}!`,
        'Try experimenting with the interactive elements to see how this concept works.',
        'The key insight here is understanding how these principles connect to real-world applications.',
        'In the next section, we\'ll explore this concept in more depth.',
        'This is related to what we learned in the previous section about fundamentals.'
      ];
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      setMessages(prev => [...prev, { sender: 'bot', text: randomResponse }]);
    }, 1000);

    // Clear the input
    setNewMessage('');
  };

  if (loading) {
    return <div className="loading">Loading course content...</div>;
  }

  if (!course) {
    return <div className="error-message">Course not found</div>;
  }

  return (
    <main className="course-view">
      <div className="course-header" style={{ backgroundColor: course.color }}>
        <div className="container">
          <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
          <h1>{course.title}</h1>
          <p className="course-description">{course.description}</p>
        </div>
      </div>

      <div className="course-container">
        <div className="course-sidebar">
          <h3>Course Sections</h3>
          <ul className="section-list">
            {course.sections.map((section, index) => (
              <li 
                key={index} 
                className={currentSection === index ? 'active' : ''}
                onClick={() => setCurrentSection(index)}
              >
                {section.title}
              </li>
            ))}
          </ul>
          <button 
            className="chat-toggle" 
            onClick={() => setChatOpen(!chatOpen)}
            style={{ backgroundColor: course.color }}
          >
            {chatOpen ? 'Close Assistant' : 'Learning Assistant'}
          </button>
        </div>

        <div className="course-content">
          <div className="section-content">
            <h2>{course.sections[currentSection].title}</h2>
            <div 
              className="content-html"
              dangerouslySetInnerHTML={{ __html: course.sections[currentSection].content }}
            />
            <div className="section-navigation">
              {currentSection > 0 && (
                <button 
                  className="btn btn-outline"
                  onClick={() => setCurrentSection(currentSection - 1)}
                >
                  ← Previous Section
                </button>
              )}
              {currentSection < course.sections.length - 1 && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setCurrentSection(currentSection + 1)}
                  style={{ backgroundColor: course.color }}
                >
                  Next Section →
                </button>
              )}
            </div>
          </div>
        </div>

        {chatOpen && (
          <div className="course-chat">
            <div className="chat-header" style={{ backgroundColor: course.color }}>
              <h3>Learning Assistant</h3>
            </div>
            <div className="chat-messages">
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.sender}`}>
                  {message.text}
                </div>
              ))}
            </div>
            <form className="chat-input" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Ask a question..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button 
                type="submit" 
                style={{ backgroundColor: course.color }}
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
};

export default CourseView;
