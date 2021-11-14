import { PropertyValue } from "@notionhq/client/build/src/api-types";

export const isDetectiveType = <T extends PropertyValue>(
  propValue: PropertyValue
): propValue is T => {
  const propertyType = (propValue as T).type;
  return (propValue as T).type === propertyType;
};
