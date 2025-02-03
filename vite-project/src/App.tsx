import { useState } from 'react'
import './App.css'
import Header from './components/header/Header'
import Sidebar from './components/sidebar/Sidebar'

function App() {
  
  const [isOpen, setIsOpen] = useState<boolean>(true)

  const toggleSidebar = () => {
    console.log(!isOpen)
    setIsOpen(!isOpen)
  }

  return (
    <div className="container">
      <Header isOpen={isOpen} toggle={toggleSidebar} />
      <Sidebar isOpen={isOpen} toggle={toggleSidebar} />

      <div>
      {/*
        header (chat title)
        chat box (contianer for chat messages)
          -> chat messages (messages exchanged between llm and user)
        chat input (user sends messages)
      */}
      </div>

    </div>
  )
}

export default App
