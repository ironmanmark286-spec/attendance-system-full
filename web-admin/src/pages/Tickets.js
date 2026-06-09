import React, { useState, useEffect, useMemo } from "react";
import api from "../api";
import {
  Headset,
  Search,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function Tickets({ theme }) {
  const [tickets, setTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/tickets");
      setTickets(response.data || []);
    } catch (err) {
      console.error("Failed to load tickets:", err);
      setError("Failed to load support tickets.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.put(`/tickets/${id}/status`, { status: 'RESOLVED' });
      loadTickets();
    } catch (e) {
      alert("Failed to update status.");
    }
  };

  const filteredTickets = useMemo(() => {
    if (!searchQuery) return tickets;
    return tickets.filter(t => 
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.emp_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tickets, searchQuery]);

  return (
    <div className="fade-in" style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header Section */}
      <div className="fade-in-up stagger-1" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "16px",
              background: `var(--primary)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Headset size={24} color="#fff" />
          </div>
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "800",
                color: "var(--text-main)",
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              Support Helpdesk
            </h1>
            <p
              style={{
                color: "var(--text-muted)",
                margin: "4px 0 0 0",
                fontSize: "14px",
              }}
            >
              Manage employee IT & HR support tickets
            </p>
          </div>
        </div>

        <div style={{ position: "relative", width: "300px", maxWidth: "100%" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            className="search-input"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "10px 16px 10px 40px", border: "1px solid var(--border)", borderRadius: "12px", background: "var(--bg-card)", color: "var(--text-main)", outline: "none" }}
          />
        </div>
      </div>

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 16px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderLeft: "4px solid #ef4444",
            borderRadius: "16px",
            marginBottom: "24px",
            color: "#ef4444",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="table-container fade-in-up stagger-2" style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Ticket ID</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Employee Info</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Issue Description</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Priority</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Current Status</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading tickets...</td></tr>
            ) : filteredTickets.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No active support tickets found.</td></tr>
            ) : (
              filteredTickets.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-bg, rgba(99, 102, 241, 0.1))', padding: '6px 12px', borderRadius: 8 }}>#{t.id}</span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{t.employee_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{t.emp_code}</div>
                  </td>
                  <td style={{ padding: '16px', maxWidth: 250 }}>
                    <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>{t.title}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>{t.description}</span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      fontWeight: 700, 
                      color: t.priority === 'High' ? 'var(--danger)' : t.priority === 'Medium' ? 'var(--warning)' : 'var(--success)' 
                    }}>
                      {t.priority}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      fontWeight: 600, 
                      fontSize: 12, 
                      padding: '4px 10px', 
                      borderRadius: 4, 
                      border: '1px solid var(--border)',
                      color: 'var(--text-main)',
                      background: 'var(--bg-input)'
                    }}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    {t.status !== 'RESOLVED' ? (
                      <button 
                        className="btn"
                        style={{ 
                          padding: '8px 16px', 
                          background: 'var(--primary)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px'
                        }} 
                        onClick={() => handleResolve(t.id)}
                      >
                        <CheckCircle2 size={14} /> Resolve
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>Resolved</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}