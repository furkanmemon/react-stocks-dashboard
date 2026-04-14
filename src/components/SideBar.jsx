import React from 'react'
import { NavLink } from 'react-router-dom'

const SideBar = ({ expanded, setExpanded }) => {
  return (
    <>
      <div className={`sidebar-overlay ${expanded ? 'active' : ''}`} onClick={() => setExpanded(false)} />

      <aside className={`sidebar bg-primary text-white d-flex flex-column ${expanded ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-header d-flex align-items-center justify-content-between">
          <span className="sidebar-title text-white fs-5 mb-0"> Stock Screener</span>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary text-white sidebar-toggle"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {expanded ? (
              <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            ) : (
              <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>

        <nav className="nav flex-column mt-3 text-white">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-white nav-link d-flex align-items-center ${isActive ? 'active-link' : ''}`
            }
          >
            <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `text-white nav-link d-flex align-items-center ${isActive ? 'active-link' : ''}`
            }
          >
            <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9,22 9,12 15,12 15,22"></polyline>
            </svg>
            <span>Home</span>
          </NavLink>
        </nav>
      </aside>
    </>
  )
}

export default SideBar
