import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import NavBar from '../components/NavBar'
import SideBar from '../components/SideBar'

const MainLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  return (
    <div className="app-container">
      <NavBar onToggleSidebar={() => setSidebarExpanded((prev) => !prev)} />

      <div className="d-flex main-layout">
        <SideBar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />

        <main className="main-content flex-fill">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
