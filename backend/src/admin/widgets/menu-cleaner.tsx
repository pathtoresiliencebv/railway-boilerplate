import React, { useEffect } from "react"

const MenuCleaner = () => {
  useEffect(() => {
    // Remove Documentation and Changelog menu items
    const removeMenuItems = () => {
      // Find and remove Documentation menu item
      const docItems = document.querySelectorAll('[data-testid*="documentation"], [href*="documentation"], a[href*="docs"]')
      docItems.forEach(item => {
        const menuItem = item.closest('li, div[role="menuitem"]')
        if (menuItem) {
          menuItem.style.display = 'none'
        }
      })

      // Find and remove Changelog menu item
      const changelogItems = document.querySelectorAll('[data-testid*="changelog"], [href*="changelog"], a[href*="changelog"]')
      changelogItems.forEach(item => {
        const menuItem = item.closest('li, div[role="menuitem"]')
        if (menuItem) {
          menuItem.style.display = 'none'
        }
      })

      // Alternative approach: look for text content
      const allMenuItems = document.querySelectorAll('li, div[role="menuitem"], a')
      allMenuItems.forEach(item => {
        const text = item.textContent?.toLowerCase()
        if (text?.includes('documentation') || text?.includes('changelog')) {
          item.style.display = 'none'
        }
      })
    }

    // Run immediately
    removeMenuItems()

    // Run again after a short delay to catch dynamically loaded items
    const timeoutId = setTimeout(removeMenuItems, 1000)

    // Set up observer to catch dynamically added menu items
    const observer = new MutationObserver(removeMenuItems)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [])

  return null // This widget doesn't render anything visible
}

MenuCleaner.zone = "profile-menu"

export default MenuCleaner
