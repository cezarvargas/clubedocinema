function isAcceptedYear(requestedYear, confirmedYear, relaxedSearch = false) {
  const requested = parseInt(requestedYear, 10);
  const confirmed = parseInt(confirmedYear, 10);
  if (!Number.isInteger(requested) || !Number.isInteger(confirmed)) return false;
  if (requested === confirmed) return true;
  return relaxedSearch && requested === confirmed - 1;
}

module.exports = { isAcceptedYear };
