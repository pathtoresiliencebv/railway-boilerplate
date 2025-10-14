import { defineWidgetConfig } from "@medusajs/admin-sdk"
import React, { useEffect } from "react"

// Custom profile menu widget to remove Documentation and Changelog
const ProfileMenuCustomizationWidget = () => {
  useEffect(() => {
    // Wait for the profile menu to be rendered
    const customizeProfileMenu = () => {
      // Find the profile menu dropdown
      const profileMenu = document.querySelector('[data-testid="profile-menu"]') || 
                      document.querySelector('[role="menu"]') ||
                      document.querySelector('.medusa-dropdown-menu')
      
      if (profileMenu) {
        // Find and remove Documentation and Changelog items
        const menuItems = profileMenu.querySelectorAll('[role="menuitem"], .medusa-dropdown-menu-item, a[href*="documentation"], a[href*="changelog"]')
        
        menuItems.forEach(item => {
          const text = item.textContent?.toLowerCase() || ''
          const href = item.getAttribute('href') || ''
          
          // Remove items containing "documentation" or "changelog"
          if (text.includes('documentation') || text.includes('changelog') || 
              href.includes('documentation') || href.includes('changelog')) {
            item.remove()
          }
        })
      }
    }

    // Run immediately and also after a short delay to catch dynamically loaded content
    customizeProfileMenu()
    const timeoutId = setTimeout(customizeProfileMenu, 1000)
    
    // Also run when the profile menu is opened
    const observer = new MutationObserver(() => {
      customizeProfileMenu()
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [])

  return null // This widget doesn't render anything visible
}

// Widget configuration - inject into the admin layout
export const config = defineWidgetConfig({
  zone: "login.after",
})

export default ProfileMenuCustomizationWidget
