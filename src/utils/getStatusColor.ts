export const getStatusColor = (status: number | undefined) => {
  switch (status) {
    case 0:
      return "orange";
    case 1:
      return "yellow";
    case 2:
      return "blue";
    case 3:
      return "green";
    case 4:
      return "green";
    case 5:
      return "red";
    case 6:
      return "purple";
    default:
      return "gray";
  }
};
