import { defineWidgetConfig } from "@medusajs/admin-shared"
import React from "react"

// Custom login logo widget
const LoginLogoWidget = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      marginBottom: '2rem'
    }}>
      <img 
        src="/static/branding/logo.png" 
        alt="Custom Logo" 
        style={{
          maxWidth: '200px',
          maxHeight: '80px',
          objectFit: 'contain'
        }}
      />
    </div>
  )
}

// Widget configuration - inject into login page
export const config = defineWidgetConfig({
  zone: "login.before",
})

export default LoginLogoWidget
