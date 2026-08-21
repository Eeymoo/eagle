Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const componentAnnotation = require('../babel-plugin/component-annotation.js');
const componentAnnotationViteAst = require('./component-annotation-vite-ast.js');
const core = require('@sentry/core');

const UNKNOWN_ELEMENT_NAME = "unknown";
const WEB_ATTRIBUTE_NAMES = [componentAnnotation.WEB_ELEMENT_NAME, componentAnnotation.WEB_COMPONENT_NAME, componentAnnotation.WEB_SOURCE_FILE_NAME];
const WEB_ATTRIBUTE_NAME_SET = new Set(WEB_ATTRIBUTE_NAMES);
function isJSXElement(value) {
  return componentAnnotationViteAst.isAstNode(value) && value.type === "JSXElement";
}
function isJSXFragment(value) {
  return componentAnnotationViteAst.isAstNode(value) && value.type === "JSXFragment";
}
function isJSXRoot(value) {
  return isJSXElement(value) || isJSXFragment(value);
}
function getStringName(node) {
  return core.isObjectLike(node) && typeof node.name === "string" ? node.name : null;
}
function getJSXName(name) {
  if (!componentAnnotationViteAst.isAstNode(name)) {
    return UNKNOWN_ELEMENT_NAME;
  }
  if (name.type === "JSXIdentifier") {
    return getStringName(name) ?? UNKNOWN_ELEMENT_NAME;
  }
  if (name.type === "JSXNamespacedName") {
    return getStringName(name.name) ?? UNKNOWN_ELEMENT_NAME;
  }
  if (name.type === "JSXMemberExpression") {
    const objectName = getJSXName(name.object);
    const propertyName = getJSXName(name.property);
    return `${objectName}.${propertyName}`;
  }
  return UNKNOWN_ELEMENT_NAME;
}
function getInsertionOffset(code, openingElement) {
  if (typeof openingElement.end !== "number") {
    return null;
  }
  if (!openingElement.selfClosing) {
    return openingElement.end - 1;
  }
  let offset = openingElement.end - 2;
  while (offset > 0 && /\s/.test(code[offset] ?? "")) {
    offset -= 1;
  }
  return code[offset] === "/" ? offset : openingElement.end - 1;
}
function isReactFragment(openingElement, fragmentContext) {
  const elementName = getJSXName(openingElement.name);
  if (elementName === "Fragment" || elementName === "React.Fragment") {
    return true;
  }
  if (fragmentContext.fragmentAliases.has(elementName)) {
    return true;
  }
  if (core.isObjectLike(openingElement.name) && openingElement.name.type === "JSXMemberExpression") {
    const objectName = getJSXName(openingElement.name.object);
    const propertyName = getJSXName(openingElement.name.property);
    return propertyName === "Fragment" && (fragmentContext.reactNamespaceAliases.has(objectName) || fragmentContext.fragmentAliases.has(objectName));
  }
  return false;
}
function addPendingAttributes(code, openingElement, componentName, ignoredComponents, fragmentContext, sourceFileName, insertionsByOffset) {
  const offset = getInsertionOffset(code, openingElement);
  if (offset === null) {
    return;
  }
  const pendingInsertion = insertionsByOffset.get(offset);
  const existingAttributes = getExistingAttributeNames(openingElement);
  for (const attributeName of pendingInsertion?.attributeValues.keys() ?? []) {
    existingAttributes.add(attributeName);
  }
  const attributes = componentAnnotation.getComponentAnnotationAttributes({
    attributeNames: [componentAnnotation.WEB_COMPONENT_NAME, componentAnnotation.WEB_ELEMENT_NAME, componentAnnotation.WEB_SOURCE_FILE_NAME],
    componentName,
    elementName: getJSXName(openingElement.name),
    existingAttributes,
    ignoredComponents,
    isFragment: isReactFragment(openingElement, fragmentContext),
    sourceFileName
  });
  if (attributes.length === 0) {
    return;
  }
  const insertion = pendingInsertion ?? insertionsByOffset.set(offset, {
    offset,
    attributeValues: /* @__PURE__ */ new Map()
  }).get(offset);
  for (const [name, value] of attributes) {
    insertion?.attributeValues.set(name, value);
  }
}
function toAttributeInsertions(insertionsByOffset) {
  return [...insertionsByOffset.values()].map(({ offset, attributeValues }) => ({
    offset,
    attributes: getOrderedAttributes(attributeValues)
  }));
}
function getExistingAttributeNames(openingElement) {
  const names = /* @__PURE__ */ new Set();
  for (const attribute of openingElement.attributes ?? []) {
    if (attribute.type === "JSXAttribute") {
      const name = getStringName(attribute.name);
      if (name) {
        names.add(name);
      }
    }
  }
  return names;
}
function getOrderedAttributes(attributeValues) {
  const attributes = [];
  for (const name of WEB_ATTRIBUTE_NAMES) {
    const value = attributeValues.get(name);
    if (value) {
      attributes.push([name, value]);
    }
  }
  for (const [name, value] of attributeValues) {
    if (!WEB_ATTRIBUTE_NAME_SET.has(name)) {
      attributes.push([name, value]);
    }
  }
  return attributes;
}

exports.addPendingAttributes = addPendingAttributes;
exports.getInsertionOffset = getInsertionOffset;
exports.getJSXName = getJSXName;
exports.getStringName = getStringName;
exports.isJSXElement = isJSXElement;
exports.isJSXFragment = isJSXFragment;
exports.isJSXRoot = isJSXRoot;
exports.isReactFragment = isReactFragment;
exports.toAttributeInsertions = toAttributeInsertions;
//# sourceMappingURL=component-annotation-vite-jsx.js.map
