import { useState } from 'react'
import "prismjs/themes/prism-tomorrow.css"
import Editor from "react-simple-code-editor"
import Prism from "prismjs"
import "prismjs/components/prism-javascript"
import Markdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github-dark.css"
import axios from 'axios'
import './App.css'

function App() {
  const [code, setCode] = useState(`function sum() {
  return 1 + 1;
}`)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState('javascript')

  async function reviewCode() {
    setLoading(true)
    try {
      const response = await axios.post('http://localhost:3000/ai/get-review', {
        code,
        language
      })
      setReview(response.data?.review || response.data)
    } catch {
      setReview("❌ Failed to get review. Please check your server.")
    } finally {
      setLoading(false)
    }
  }

  function resetEditor() {
    setCode('')
    setReview('')
  }

  function copyCodeToClipboard() {
    navigator.clipboard.writeText(code)
    alert("✅ Code copied to clipboard!")
  }

  function downloadReview() {
    const blob = new Blob([review], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "review.md"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Navbar */}
      <nav className="navbar bg-dark navbar-dark mb-4 shadow">
        <div className="container-fluid">
          <a className="navbar-brand mx-auto fw-bold fs-4" href="#">AI-CodeReviewer</a>
        </div>
      </nav>

      {/* Main Panel */}
      <div className="container">
        <div className="row g-4">

          {/* Code Editor Panel */}
          <div className="col-md-6">
            <div className="p-3 border rounded bg-light shadow-sm h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Write Your Code</h5>
                <div className="btn-group">
                  <button className="btn btn-outline-secondary btn-sm" onClick={copyCodeToClipboard}>📋 Copy</button>
                  <button className="btn btn-outline-danger btn-sm" onClick={resetEditor}>♻️ Reset</button>
                </div>
              </div>

              {/* Scrollable Code Editor */}
              <div
                style={{
                  height: '450px',
                  marginTop: '-13px',
                  overflowY: 'auto',
                  overflowX: 'auto',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  backgroundColor: '#2d2d2d'
                }}
              >
                <Editor
                  value={code}
                  onValueChange={setCode}
                  highlight={code =>
                    Prism.highlight(code, Prism.languages.javascript, "javascript")
                  }
                  padding={10}
                  style={{
                    fontFamily: '"Fira Code", "Fira Mono", monospace',
                    fontSize: 14,
                    minHeight: '100%',
                    color: '#f8f8f2',
                    whiteSpace: 'pre',
                  }}
                />
              </div>

              {/* Bottom Row with Language Select + Review Button */}
              <div className="d-flex justify-content-between align-items-center mt-1">
                {/* Language Dropdown */}
                <div style={{ maxWidth: '200px' }}>
                  <select
                    className="form-select form-select-sm"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="c">C</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>

                {/* Review Button */}
                <button className="btn btn-primary px-4" onClick={reviewCode} disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Reviewing...
                    </>
                  ) : (
                    <>Review Code</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Review Panel */}
          <div className="col-md-6">
            <div className="p-3 border rounded bg-light shadow-sm h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">AI Feedback</h5>
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={downloadReview}
                  disabled={!review}
                >
                  ⬇️ Download
                </button>
              </div>

              {/* Scrollable Review Output */}
              <div
                style={{
                  height: '490px',
                  marginTop: '-13px',
                  overflowY: 'auto',
                  overflowX: 'auto',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  padding: '10px',
                  backgroundColor: '#2d2d2d',
                  color: '#f8f8f2',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {review ? (
                  <Markdown
                    className="markdown"
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {review}
                  </Markdown>
                ) : (
                  <p className="text-muted">Feedback will appear here...</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

export default App
