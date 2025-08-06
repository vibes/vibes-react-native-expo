export const getMajorSdkVersion = (
  sdkVersion: string | undefined,
): number | null => {
  if (!sdkVersion) {
    return null;
  }
  const [major] = sdkVersion.split(".");
  if (!major) {
    return null;
  }
  const majorVersionNumber = parseInt(major, 10);
  return isNaN(majorVersionNumber) ? null : majorVersionNumber;
};
