Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const componentAnnotationViteJsx = require('./component-annotation-vite-jsx.js');
const componentAnnotationViteAst = require('./component-annotation-vite-ast.js');
const componentAnnotationViteFragments = require('./component-annotation-vite-fragments.js');
const core = require('@sentry/core');

function collectViteComponentAnnotationInsertions(code, ast, ignoredComponents, sourceFileName) {
  const fragmentContext = componentAnnotationViteFragments.collectFragmentContext(ast);
  const components = collectComponentJSXRoots(ast);
  const insertionsByOffset = /* @__PURE__ */ new Map();
  for (const component of components) {
    for (const root of component.roots) {
      processJSX(code, root, component.name, ignoredComponents, fragmentContext, sourceFileName, insertionsByOffset);
    }
  }
  return componentAnnotationViteJsx.toAttributeInsertions(insertionsByOffset);
}
function getJSXRootsFromReturnArgument(argument) {
  if (componentAnnotationViteJsx.isJSXRoot(argument)) {
    return [argument];
  }
  if (core.isObjectLike(argument) && argument.type === "ConditionalExpression") {
    return [argument.consequent, argument.alternate].filter(componentAnnotationViteJsx.isJSXRoot);
  }
  return [];
}
function getReturnedJSXFromFunction(functionNode) {
  const body = functionNode.body;
  if (componentAnnotationViteJsx.isJSXRoot(body)) {
    return [body];
  }
  if (!core.isObjectLike(body) || body.type !== "BlockStatement") {
    return [];
  }
  const bodyStatements = Array.isArray(body.body) ? body.body : [];
  const returnStatement = bodyStatements.find((statement) => {
    return componentAnnotationViteAst.isAstNode(statement) && statement.type === "ReturnStatement";
  });
  return core.isObjectLike(returnStatement) ? getJSXRootsFromReturnArgument(returnStatement.argument) : [];
}
function pushFunctionComponent(components, nameNode, functionNode) {
  const name = componentAnnotationViteJsx.getStringName(nameNode);
  if (name) {
    components.push({
      name,
      roots: getReturnedJSXFromFunction(functionNode)
    });
  }
}
function collectComponentJSXRoots(ast) {
  const components = [];
  componentAnnotationViteAst.walkAst(ast, (node) => {
    if (node.type === "FunctionDeclaration" && core.isObjectLike(node.id)) {
      pushFunctionComponent(components, node.id, node);
      return;
    }
    if (node.type === "VariableDeclarator" && core.isObjectLike(node.id)) {
      if (componentAnnotationViteAst.isAstNode(node.init) && node.init.type === "ArrowFunctionExpression") {
        pushFunctionComponent(components, node.id, node.init);
      }
      return;
    }
    if (node.type === "ClassDeclaration") {
      pushClassComponent(components, node);
    }
  });
  return components;
}
function pushClassComponent(components, node) {
  const renderMethodBody = getClassRenderMethodBody(node);
  if (!renderMethodBody) {
    return;
  }
  const roots = [];
  componentAnnotationViteAst.walkAst(renderMethodBody, (child) => {
    if (child.type === "ReturnStatement" && componentAnnotationViteJsx.isJSXRoot(child.argument)) {
      roots.push(child.argument);
    }
  });
  components.push({
    name: componentAnnotationViteJsx.getStringName(node.id) ?? "",
    roots
  });
}
function getClassRenderMethodBody(node) {
  if (!core.isObjectLike(node.body) || !Array.isArray(node.body.body)) {
    return null;
  }
  const renderMethod = node.body.body.find((member) => {
    return core.isObjectLike(member) && core.isObjectLike(member.key) && componentAnnotationViteJsx.getStringName(member.key) === "render" && (core.isObjectLike(member.value) || core.isObjectLike(member.body));
  });
  if (!core.isObjectLike(renderMethod)) {
    return null;
  }
  if (componentAnnotationViteAst.isAstNode(renderMethod.value)) {
    return renderMethod.value;
  }
  return componentAnnotationViteAst.isAstNode(renderMethod) ? renderMethod : null;
}
function processJSX(code, node, componentName, ignoredComponents, fragmentContext, sourceFileName, insertionsByOffset) {
  if (componentAnnotationViteJsx.isJSXElement(node)) {
    componentAnnotationViteJsx.addPendingAttributes(
      code,
      node.openingElement,
      componentName,
      ignoredComponents,
      fragmentContext,
      sourceFileName,
      insertionsByOffset
    );
  }
  for (const child of node.children ?? []) {
    if (componentAnnotationViteJsx.isJSXRoot(child)) {
      processJSX(code, child, "", ignoredComponents, fragmentContext, sourceFileName, insertionsByOffset);
    }
  }
}

exports.collectViteComponentAnnotationInsertions = collectViteComponentAnnotationInsertions;
//# sourceMappingURL=component-annotation-vite-walk.js.map
