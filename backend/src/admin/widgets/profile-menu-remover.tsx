import { defineWidgetConfig } from "@medusajs/admin-sdk"
import React, { useEffect } from "react"

// Widget to remove Documentation and Changelog from profile menu
const ProfileMenuRemover = () => {
  useEffect(() => {
    const removeUnwantedMenuItems = () => {
      // Multiple selectors to find the profile menu
      const menuSelectors = [
        '[data-testid="profile-menu"]',
        '.profile-menu',
        '[role="menu"]',
        '.user-menu',
        '.account-menu',
        '.profile-dropdown',
        '.user-dropdown',
        '[data-testid*="menu"]',
        '.medusa-admin-menu',
        '.admin-menu'
      ]
      
      menuSelectors.forEach(selector => {
        const menu = document.querySelector(selector)
        if (menu) {
          // Find and remove Documentation links
          const docLinks = Array.from(menu.querySelectorAll('a')).filter(link => {
            const href = link.getAttribute('href') || ''
            const text = link.textContent?.toLowerCase() || ''
            return href.includes('documentation') || 
                   href.includes('docs') || 
                   text.includes('documentation') ||
                   text.includes('docs')
          })
          
          // Find and remove Changelog links
          const changelogLinks = Array.from(menu.querySelectorAll('a')).filter(link => {
            const href = link.getAttribute('href') || ''
            const text = link.textContent?.toLowerCase() || ''
            return href.includes('changelog') || 
                   text.includes('changelog')
          })
          
          // Remove the links
          [...docLinks, ...changelogLinks].forEach(link => {
            // Try to remove the parent element (usually a list item)
            const parent = link.closest('li') || link.closest('div') || link.parentElement
            if (parent) {
              parent.remove()
            } else {
              link.remove()
            }
          })
        }
      })
    }

    // Run immediately
    removeUnwantedMenuItems()
    
    // Also run when DOM changes
    const observer = new MutationObserver(() => {
      removeUnwantedMenuItems()
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    // Cleanup
    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}

// Widget configuration - inject into the admin layout
export const config = defineWidgetConfig({
  zone: "admin.layout.after",
})

export default ProfileMenuRemover
