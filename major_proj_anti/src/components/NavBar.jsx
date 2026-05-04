import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, Map, Activity, MessageSquare } from 'lucide-react';

const NavBar = () => {
  return (
    <header className="navbar">
      <div className="nav-brand">
        <ShieldAlert className="logo-icon text-red" size={32} />
        <div>
          <h1 className="app-title">CrisisResponse OS</h1>
          <p className="app-subtitle">Multimodal Disaster Monitoring</p>
        </div>
      </div>
      
      <nav className="nav-links">
        <NavLink 
          to="/" 
          className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
        >
          <Map size={18} />
          Dashboard
        </NavLink>
        <NavLink 
          to="/summary" 
          className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
        >
          <Activity size={18} />
          Satellite Summary
        </NavLink>
        <NavLink 
          to="/tweets" 
          className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
        >
          <MessageSquare size={18} />
          Live Reports
        </NavLink>
      </nav>
    </header>
  );
};

export default NavBar;
