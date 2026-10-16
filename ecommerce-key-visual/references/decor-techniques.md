# 可选装饰技法库（已验证·自包含）

本库收录在真实试跑中验证过的可选装饰技法，写成**可直接复制的 CSS**，不依赖任何包外案例或参考图。技法**不是通用规则**，只在满足触发条件时按「触发条件 → CSS 片段 → 注意事项」取用。每条的**方法（CSS／版式逻辑）可自由借鉴**，但技法里的**数字或文字本身是内容**，必须来自资料包／任务书并逐条对应事实表——「方法可借、内容须真」是硬边界。

> 自包含说明：本库所有 CSS 片段均可直接粘贴进模板的 `<style>`（追加在模板样式之后），无需外部素材、无需参考图；换案例满足触发条件即取用，不必重新发明。

## 通用纪律：容器（装饰）与内文（内容）必须分离

- **装饰容器**（`.ghost`／`.pill`／任何为视觉存在的层）按「纯装饰」挂 `data-check` 并过审计；它**只承载装饰样式，不得承载可见文字内容**。
- **容器内的一切文字／数字都是内容元素**，必须**自身**挂 `data-check`（不能靠容器挂了 `data-check` 就算登记——`layout-audit.cjs` 第三遍会抓「自身有可见文字却未自身挂 `data-check`」的元素，见 `SKILL.md` 制作·审计覆盖）。
- 实操：把胶囊／幽灵数字里的文字包成独立元素（如 `<span data-check>…</span>`，或给文本节点所在的元素加 `data-check`），**不要让可见文字成为装饰容器的「直接文本子节点」**——否则第三遍审计会告警，且内容溯源无从核对。

## 1. 幽灵数字（Ghost number）

- **触发条件**：资料包含一个显著、有事实依据的单一数字（如吸力 18,000 Pa、续航 43 小时），希望把它做成低对比的巨型背景数字强化记忆点。
- **做法**：在 `.layout` 内、文案之前放一个绝对定位的 `.ghost` 层（`z-index` 低于商品与文案），数字用超大字号、低透明度，颜色取自品牌色或中性色；数字必须**宽于遮挡它的主体**，否则会被主体盖住只露边角。
- **CSS 片段（可直接复制）**：
  ```css
  .ghost{position:absolute;left:40%;right:0;top:0;bottom:0;z-index:0;display:flex;align-items:flex-end;justify-content:flex-end;overflow:hidden;pointer-events:none}
  .ghost .num{font-size:300px;font-weight:800;color:rgba(176,141,87,.13);line-height:.8}
  .ghost .unit{font-size:84px;color:rgba(176,141,87,.17)}
  .copy{position:relative;z-index:2}
  .product{position:relative;z-index:1}
  ```
- **注意事项**：`.ghost` 是装饰层（挂 `data-check`）；**层内的数字必须来自资料包／任务书**（受「只用资料包素材」约束），且数字文本须自身挂 `data-check`（如 `<span data-check class="num">18,000</span>`），不得自造，也不得只靠 `.ghost` 的 `data-check` 登记。**数字宽度不够会整体被商品遮挡，先量主体宽度再定字号。**

## 2. 雾光（Atmospheric glow）

- **触发条件**：需要「晨白／通透／高级感」的氛围，或商品在浅色背景上缺乏层次。可用代码绘制，不依赖外部素材。
- **CSS 片段（叠加在 `#background` 的多层 `background` 上，零新增 DOM、零外部素材，可直接复制）**：
  ```css
  #background{
    background:
      radial-gradient(62% 52% at 76% 10%, rgba(255,255,255,.92), rgba(255,255,255,0) 70%),
      radial-gradient(46% 38% at 8% 92%, rgba(214,205,189,.40), rgba(214,205,189,0) 70%),
      var(--bg);
  }
  ```
- **注意事项**：用多层 `radial-gradient` 叠在模板既有背景色之上即可，不必新增元素；如确需新增装饰层，须挂 `data-check`。此技法**无内容元素**，纯属方法，可自由借鉴。

## 3. 玻璃卡（Glass pill）

- **触发条件**：希望把功能点／卖点做成「等宽玻璃胶囊」信息条，提升精致度与可读性（替代纯文字分行）。
- **CSS 片段（可直接复制）**：
  ```css
  .pill{display:inline-flex;align-items:center;gap:.6em;padding:.5em .9em;border-radius:12px;
        background:rgba(255,255,255,.72);border:1px solid #E4DAC6;color:var(--ink);font-size:var(--small)}
  ```
- **注意事项**：`.pill` 是装饰容器（挂 `data-check`）；**胶囊内文字仍属内容元素，须逐条对应资料包**，数量与文案受「只用资料包素材」约束；**每个胶囊的文字必须自身挂 `data-check`**（如 `<span data-check>…</span>`），不能只靠 `.pill` 登记——否则第三遍审计会告警「持有可见文字却未挂 `data-check`」。玻璃卡容器须挂 `data-check`。
