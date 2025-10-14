import { defineWidgetConfig } from "@medusajs/admin-sdk"
import React from "react"

// Custom login logo widget
const LoginLogoWidget = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      marginBottom: '2rem',
      padding: '1rem'
    }}>
      <img 
        src="/static/branding/logo.png" 
        alt="Aurelio Custom Logo" 
        style={{
          maxWidth: '250px',
          maxHeight: '100px',
          objectFit: 'contain',
          borderRadius: '8px'
        }}
        onError={(e) => {
          console.log('Logo failed to load, using fallback');
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  )
}

// Widget configuration - inject into login page before the form
export const config = defineWidgetConfig({
  zone: "login.before",
})

export default LoginLogoWidget
