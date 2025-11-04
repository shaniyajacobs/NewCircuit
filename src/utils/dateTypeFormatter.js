// Utility function to get the proper date type name for display
export const getDateTypeName = (item) => {
  // Handle bundles
  if (item.packageType === "Bundle") {
    return `${item.title} Bundle`;
  }
  
  // Handle individual dates
  switch (item.title) {
    case "Brunch":
      return "Virtual Brunch Speed Date";
    case "Happy Hour":
      return "Virtual Happy Hour Speed Date";
    case "Dinner":
      return "Virtual Dinner Speed Date";
    default:
      return "Virtual Speed Date";
  }
};

// Function to format cart item display text
export const formatCartItemDisplay = (item) => {
  const totalDates = item.quantity * (item.numDates || 1);
  const dateTypeName = getDateTypeName(item);
  
  return `${totalDates} x ${dateTypeName}${totalDates > 1 ? "s" : ""}`;
};
