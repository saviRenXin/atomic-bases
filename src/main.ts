import {
  BasesView,
  Keymap,
  MarkdownView,
  Plugin,
  QueryController,
  TFile,
  type PaneType
} from "obsidian";
import { findAtomicPropertyLocation, tokenizeHighlights } from "./highlight.mjs";

const VIEW_TYPE = "atomic-highlight-list";

export default class AtomicBasesPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerBasesView(VIEW_TYPE, {
      name: "高亮列表",
      icon: "highlighter",
      factory: (controller, containerEl) => {
        return new AtomicHighlightView(controller, containerEl);
      }
    });
  }
}

class AtomicHighlightView extends BasesView {
  readonly type = VIEW_TYPE;
  private readonly containerEl: HTMLElement;

  constructor(controller: QueryController, parentEl: HTMLElement) {
    super(controller);
    this.containerEl = parentEl.createDiv("atomic-bases-view");
  }

  public onDataUpdated(): void {
    this.containerEl.empty();

    for (const group of this.data.groupedData) {
      if (group.hasKey()) {
        this.containerEl.createDiv({
          cls: "atomic-bases-group-header",
          text: group.key?.toString() ?? ""
        });
      }

      const list = this.containerEl.createEl("ul", { cls: "atomic-bases-list" });
      const order = this.config.getOrder();

      for (const entry of group.entries) {
        const row = list.createEl("li", { cls: "atomic-bases-entry" });
        let rendered = false;

        for (const propertyId of order) {
          const value = entry.getValue(propertyId);
          if (!value || !value.isTruthy()) continue;

          const normalizedId = normalizePropertyId(propertyId);
          if (normalizedId === "formula.card") {
            renderCardLink(row, entry.file.path, entry.file.name, this.app);
          } else if (normalizedId === "note.atomic") {
            renderAtomic(row, entry.file, value.toString(), this.app);
          } else {
            renderPlain(row, value.toString());
          }

          rendered = true;
        }

        if (!rendered) row.remove();
      }
    }
  }
}

function normalizePropertyId(propertyId: string): string {
  return propertyId.includes(".") ? propertyId : `note.${propertyId}`;
}

function renderCardLink(
  parent: HTMLElement,
  path: string,
  fileName: string,
  app: AtomicBasesPlugin["app"]
): void {
  const title = fileName.replace(/^IMG_\d+-/, "").replace(/\.md$/i, "");
  const wrapper = parent.createDiv("atomic-bases-card");
  const link = wrapper.createEl("a", {
    cls: "internal-link",
    text: title,
    attr: { "data-href": path, href: "#" }
  });

  link.addEventListener("click", (event) => {
    event.preventDefault();
    void app.workspace.openLinkText(path, "", Keymap.isModEvent(event));
  });
}

function renderAtomic(
  parent: HTMLElement,
  file: TFile,
  value: string,
  app: AtomicBasesPlugin["app"]
): void {
  const property = parent.createDiv({
    cls: "atomic-bases-property atomic-bases-atomic-property"
  });
  const jumpLink = property.createEl("span", {
    cls: "atomic-bases-source-link",
    text: "›",
    attr: {
      role: "button",
      tabindex: "0",
      title: "跳转到 atomic 源码",
      "aria-label": "跳转到 atomic 源码"
    }
  });

  jumpLink.addEventListener("click", (event) => {
    event.stopPropagation();
    void focusAtomicProperty(app, file, Keymap.isModEvent(event));
  });

  jumpLink.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    event.stopPropagation();
    void focusAtomicProperty(app, file, false);
  });

  const propertyText = property.createSpan("atomic-bases-property-text");

  for (const segment of tokenizeHighlights(value)) {
    if (segment.covered) {
      renderCovered(propertyText, segment.text);
    } else if (segment.highlighted) {
      propertyText.createEl("mark", { text: segment.text });
    } else {
      propertyText.createSpan({ text: segment.text });
    }
  }
}

function renderCovered(parent: HTMLElement, text: string): void {
  const cover = parent.createSpan({
    cls: "atomic-bases-cover",
    text,
    attr: {
      role: "button",
      tabindex: "0",
      "aria-pressed": "false",
      "aria-label": "显示背诵内容"
    }
  });

  const toggle = (): void => {
    const revealed = cover.dataset.revealed === "true";
    cover.dataset.revealed = String(!revealed);
    cover.setAttribute("aria-pressed", String(!revealed));
    cover.setAttribute("aria-label", revealed ? "显示背诵内容" : "隐藏背诵内容");
  };

  cover.addEventListener("click", toggle);
  cover.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    toggle();
  });
}

async function focusAtomicProperty(
  app: AtomicBasesPlugin["app"],
  file: TFile,
  newLeaf: PaneType | boolean
): Promise<void> {
  try {
    const source = await app.vault.read(file);
    const location = findAtomicPropertyLocation(source);
    const target = location ?? { line: 0, ch: 0 };
    const leaf = app.workspace.getLeaf(newLeaf);

    await leaf.openFile(file, {
      state: { mode: "source", source: true },
      eState: { line: target.line, ch: target.ch },
      active: true
    });

    const view = leaf.view instanceof MarkdownView ? leaf.view : null;
    if (!view || view.file?.path !== file.path || !view.editor) return;

    view.editor.setCursor(target);
    view.editor.scrollIntoView({ from: target, to: target }, true);
    view.editor.focus();
  } catch (error) {
    console.error("Atomic Bases: failed to jump to the atomic property", error);
  }
}

function renderPlain(parent: HTMLElement, value: string): void {
  parent.createDiv({ cls: "atomic-bases-property", text: value });
}
