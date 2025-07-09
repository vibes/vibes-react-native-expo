export const getMajorSdkVersion = (
  sdkVersion: string | undefined,
): number | null => {
  if (!sdkVersion) {
    return null;
  }
  // Sdk version is in format: XX.XX.XX, eg. 53.0.0
  const [major] = sdkVersion.split(".");
  if (!major) {
    return null;
  }
  const majorVersionNumber = parseInt(major, 10);
  return isNaN(majorVersionNumber) ? null : majorVersionNumber;
};
