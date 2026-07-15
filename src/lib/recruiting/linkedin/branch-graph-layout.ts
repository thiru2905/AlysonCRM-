import type { BuiltSearchBranch, SearchBranch, SearchBranchPlan } from "./branch-types";

export type BranchGraphNodeKind = "root" | "category" | "branch";

export interface BranchGraphNode {
  id: string;
  kind: BranchGraphNodeKind;
  label: string;
  category?: SearchBranch["category"];
  branch?: BuiltSearchBranch;
  x: number;
  y: number;
  r: number;
}

export interface BranchGraphEdge {
  id: string;
  from: string;
  to: string;
}

export interface BranchGraphLayout {
  nodes: BranchGraphNode[];
  edges: BranchGraphEdge[];
  width: number;
  height: number;
}

const CATEGORY_ORDER: SearchBranch["category"][] = [
  "core",
  "adjacent",
  "specialist",
  "senior",
  "junior",
];

const CATEGORY_LABEL: Record<SearchBranch["category"], string> = {
  core: "Core roles",
  adjacent: "Adjacent roles",
  specialist: "Specialists",
  senior: "Senior variants",
  junior: "Junior variants",
};

export function categoryLabel(category: SearchBranch["category"]): string {
  return CATEGORY_LABEL[category] ?? category;
}

/** Compute layout width from branch count so tree leaves don't overlap. */
export function layoutDimensions(branchCount: number): { width: number; height: number } {
  const width = Math.max(920, Math.min(1600, 120 + branchCount * 72));
  return { width, height: 640 };
}

/** Radial graph: root center, category hubs on inner ring, branches on outer ring. */
export function layoutBranchGraph(
  plan: SearchBranchPlan,
  built: BuiltSearchBranch[],
  width?: number,
  height?: number
): BranchGraphLayout {
  const dims = layoutDimensions(built.length);
  width = width ?? dims.width;
  height = height ?? dims.height;
  const cx = width / 2;
  const cy = height / 2;
  const nodes: BranchGraphNode[] = [];
  const edges: BranchGraphEdge[] = [];

  nodes.push({
    id: "root",
    kind: "root",
    label: plan.baseRole,
    x: cx,
    y: cy,
    r: 44,
  });

  const byCategory = new Map<SearchBranch["category"], BuiltSearchBranch[]>();
  for (const branch of built) {
    const list = byCategory.get(branch.category) ?? [];
    list.push(branch);
    byCategory.set(branch.category, list);
  }

  const activeCategories = CATEGORY_ORDER.filter((c) => (byCategory.get(c)?.length ?? 0) > 0);
  const catCount = activeCategories.length || 1;
  const catRadius = Math.min(width, height) * 0.22;

  activeCategories.forEach((category, ci) => {
    const catId = `cat-${category}`;
    const angle = (ci / catCount) * Math.PI * 2 - Math.PI / 2;
    const catX = cx + Math.cos(angle) * catRadius;
    const catY = cy + Math.sin(angle) * catRadius;

    nodes.push({
      id: catId,
      kind: "category",
      label: categoryLabel(category),
      category,
      x: catX,
      y: catY,
      r: 32,
    });
    edges.push({ id: `e-root-${catId}`, from: "root", to: catId });

    const branches = byCategory.get(category) ?? [];
    const branchRadius = Math.min(width, height) * 0.38;
    branches.forEach((branch, bi) => {
      const spread = Math.min(Math.PI * 0.9, (Math.PI * 2) / Math.max(branches.length, 1));
      const start = angle - spread / 2;
      const step = branches.length > 1 ? spread / (branches.length - 1) : 0;
      const bAngle = branches.length === 1 ? angle : start + step * bi;
      const bx = cx + Math.cos(bAngle) * branchRadius;
      const by = cy + Math.sin(bAngle) * branchRadius;

      nodes.push({
        id: branch.id,
        kind: "branch",
        label: branch.label,
        category: branch.category,
        branch,
        x: bx,
        y: by,
        r: 30,
      });
      edges.push({ id: `e-${catId}-${branch.id}`, from: catId, to: branch.id });
    });
  });

  // Flat fallback when no categories / single bucket
  if (activeCategories.length === 0 && built.length > 0) {
    built.forEach((branch, i) => {
      const angle = (i / built.length) * Math.PI * 2 - Math.PI / 2;
      const r = Math.min(width, height) * 0.32;
      nodes.push({
        id: branch.id,
        kind: "branch",
        label: branch.label,
        category: branch.category,
        branch,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        r: 30,
      });
      edges.push({ id: `e-root-${branch.id}`, from: "root", to: branch.id });
    });
  }

  return { nodes, edges, width, height };
}

export interface BranchTreeNode {
  id: string;
  kind: BranchGraphNodeKind;
  label: string;
  category?: SearchBranch["category"];
  branch?: BuiltSearchBranch;
  depth: number;
  children: BranchTreeNode[];
}

export function buildBranchTree(plan: SearchBranchPlan, built: BuiltSearchBranch[]): BranchTreeNode {
  const root: BranchTreeNode = {
    id: "root",
    kind: "root",
    label: plan.baseRole,
    depth: 0,
    children: [],
  };

  const byCategory = new Map<SearchBranch["category"], BuiltSearchBranch[]>();
  for (const branch of built) {
    const list = byCategory.get(branch.category) ?? [];
    list.push(branch);
    byCategory.set(branch.category, list);
  }

  for (const category of CATEGORY_ORDER) {
    const branches = byCategory.get(category);
    if (!branches?.length) continue;
    const catNode: BranchTreeNode = {
      id: `cat-${category}`,
      kind: "category",
      label: categoryLabel(category),
      category,
      depth: 1,
      children: branches.map((branch) => ({
        id: branch.id,
        kind: "branch" as const,
        label: branch.label,
        category: branch.category,
        branch,
        depth: 2,
        children: [],
      })),
    };
    root.children.push(catNode);
  }

  if (root.children.length === 0) {
    root.children = built.map((branch) => ({
      id: branch.id,
      kind: "branch" as const,
      label: branch.label,
      category: branch.category,
      branch,
      depth: 1,
      children: [],
    }));
  }

  return root;
}

/** Compute x/y positions for tree nodes (top-down). */
export function layoutBranchTree(
  tree: BranchTreeNode,
  width?: number,
  height?: number
): BranchGraphLayout {
  const leaves = countLeaves(tree);
  const dims = layoutDimensions(leaves);
  width = width ?? dims.width;
  height = height ?? dims.height;
  const nodes: BranchGraphNode[] = [];
  const edges: BranchGraphEdge[] = [];

  let leafIndex = 0;
  const levelY = [80, 220, 400, 560];

  function place(node: BranchTreeNode, depth: number): number {
    if (node.children.length === 0) {
      const x = ((leafIndex + 0.5) / Math.max(leaves, 1)) * (width - 80) + 40;
      leafIndex += 1;
      const y = levelY[Math.min(depth, levelY.length - 1)] ?? 80 + depth * 120;
      nodes.push({
        id: node.id,
        kind: node.kind,
        label: node.label,
        category: node.category,
        branch: node.branch,
        x,
        y,
        r: node.kind === "root" ? 42 : node.kind === "category" ? 30 : 28,
      });
      return x;
    }

    const childXs = node.children.map((child) => place(child, depth + 1));
    const x =
      childXs.length === 1
        ? childXs[0]
        : (Math.min(...childXs) + Math.max(...childXs)) / 2;
    const y = levelY[Math.min(depth, levelY.length - 1)] ?? 80 + depth * 120;

    nodes.push({
      id: node.id,
      kind: node.kind,
      label: node.label,
      category: node.category,
      branch: node.branch,
      x,
      y,
      r: node.kind === "root" ? 42 : node.kind === "category" ? 30 : 28,
    });

    for (const child of node.children) {
      edges.push({ id: `e-${node.id}-${child.id}`, from: node.id, to: child.id });
    }

    return x;
  }

  place(tree, 0);

  return { nodes, edges, width, height };
}

function countLeaves(node: BranchTreeNode): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((sum, c) => sum + countLeaves(c), 0);
}

/** Theme-safe palette — SVG presentation attrs cannot use CSS variables. */
export const CATEGORY_STYLES: Record<
  SearchBranch["category"],
  { fill: string; stroke: string; glow: string; label: string }
> = {
  core: { fill: "#dcfce7", stroke: "#16a34a", glow: "#22c55e", label: "#14532d" },
  adjacent: { fill: "#dbeafe", stroke: "#2563eb", glow: "#3b82f6", label: "#1e3a8a" },
  specialist: { fill: "#cffafe", stroke: "#0891b2", glow: "#06b6d4", label: "#164e63" },
  senior: { fill: "#f3e8ff", stroke: "#9333ea", glow: "#a855f7", label: "#581c87" },
  junior: { fill: "#fef3c7", stroke: "#d97706", glow: "#f59e0b", label: "#78350f" },
};

/** @deprecated use CATEGORY_STYLES */
export const CATEGORY_COLORS: Record<SearchBranch["category"], string> = {
  core: CATEGORY_STYLES.core.stroke,
  adjacent: CATEGORY_STYLES.adjacent.stroke,
  specialist: CATEGORY_STYLES.specialist.stroke,
  senior: CATEGORY_STYLES.senior.stroke,
  junior: CATEGORY_STYLES.junior.stroke,
};

export const ROOT_NODE_STYLE = {
  fill: "#ede9fe",
  stroke: "#7c3aed",
  glow: "#8b5cf6",
  label: "#4c1d95",
};

export const CATEGORY_NODE_STYLE = {
  fill: "#f1f5f9",
  stroke: "#64748b",
  label: "#334155",
};

export function nodeVisual(
  node: Pick<BranchGraphNode, "kind" | "category">,
  selected: boolean,
  hover: boolean
): { fill: string; stroke: string; strokeWidth: number; glow?: string; labelColor: string } {
  if (node.kind === "root") {
    return {
      fill: ROOT_NODE_STYLE.fill,
      stroke: selected || hover ? ROOT_NODE_STYLE.glow : ROOT_NODE_STYLE.stroke,
      strokeWidth: selected ? 3 : 2,
      glow: ROOT_NODE_STYLE.glow,
      labelColor: ROOT_NODE_STYLE.label,
    };
  }
  if (node.kind === "category") {
    return {
      fill: CATEGORY_NODE_STYLE.fill,
      stroke: selected || hover ? "#475569" : CATEGORY_NODE_STYLE.stroke,
      strokeWidth: selected ? 2.5 : 2,
      labelColor: CATEGORY_NODE_STYLE.label,
    };
  }
  const cat = node.category ?? "adjacent";
  const style = CATEGORY_STYLES[cat];
  return {
    fill: style.fill,
    stroke: selected || hover ? style.glow : style.stroke,
    strokeWidth: selected ? 3 : 2,
    glow: style.glow,
    labelColor: style.label,
  };
}

export const NODE_COLORS: Record<
  BranchGraphNodeKind | "default",
  { fill: string; stroke: string; text: string }
> = {
  root: { fill: ROOT_NODE_STYLE.fill, stroke: ROOT_NODE_STYLE.stroke, text: ROOT_NODE_STYLE.label },
  category: {
    fill: CATEGORY_NODE_STYLE.fill,
    stroke: CATEGORY_NODE_STYLE.stroke,
    text: CATEGORY_NODE_STYLE.label,
  },
  branch: { fill: "#ffffff", stroke: "#94a3b8", text: "#0f172a" },
  default: { fill: "#ffffff", stroke: "#94a3b8", text: "#0f172a" },
};
