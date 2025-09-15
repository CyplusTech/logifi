function maskEmail(email) {
  if (!email || !email.includes("@")) return email;

  const [localPart, domain] = email.split("@");
  const firstPart = localPart.slice(0, 5);
  const lastPart = localPart.slice(-1);

  return `${firstPart}.....${lastPart}@${domain}`;
}

module.exports = maskEmail;
