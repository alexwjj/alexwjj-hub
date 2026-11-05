import { useEffect, useState, type CSSProperties } from "react";
import { Popover } from "@base-ui/react/popover";
import { Icon } from "./hub-ui";
import { AnimatePresence, motion } from "motion/react";
export const wallpapers = [
  { id: "silver", name: "银白流体", file: "01-silver-flow.png" },
  { id: "mountains", name: "雾山留白", file: "02-misty-mountains.png" },
  { id: "clouds", name: "云间微光", file: "03-cloud-light.png" },
  { id: "pearl", name: "珍珠弧面", file: "04-pearl-arcs.png" },
];
function presetStrength(id: string) {
  return id === "silver" ? 35 : 50;
}
export function Wallpaper({ id }: { id: string }) {
  const wallpaper = wallpapers.find((item) => item.id === id) || wallpapers[0];
  return (
    <div className="app-wallpaper" aria-hidden="true">
      <AnimatePresence initial={false}>
        <motion.div
          key={wallpaper.id}
          className="wallpaper-layer"
          style={{
            backgroundImage: `url(/design/wallpapers/${wallpaper.file})`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32 }}
        />
      </AnimatePresence>
    </div>
  );
}
export function useAppearance() {
  const [appearance, setAppearance] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("hub-appearance-r2") || "null",
      );
      if (
        saved &&
        wallpapers.some((p) => p.id === saved.wallpaper) &&
        Number.isFinite(saved.strength)
      )
        return {
          wallpaper: saved.wallpaper as string,
          strength: Math.max(0, Math.min(100, saved.strength)),
        };
    } catch {
      /* Storage is optional. */
    }
    return { wallpaper: "silver", strength: 35 };
  });
  useEffect(() => {
    document.documentElement.dataset.wallpaper = appearance.wallpaper;
    document.documentElement.style.setProperty(
      "--wallpaper-strength",
      String(appearance.strength / 100),
    );
    try {
      localStorage.setItem("hub-appearance-r2", JSON.stringify(appearance));
    } catch {
      /* Storage is optional. */
    }
  }, [appearance]);
  return { appearance, setAppearance };
}
export function BackgroundSettings({
  appearance,
  onChange,
}: {
  appearance: { wallpaper: string; strength: number };
  onChange: (value: { wallpaper: string; strength: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="background-trigger" aria-label="切换背景">
        <Icon name="image" size={15} />
        <span>背景</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          sideOffset={18}
          anchor={() => document.querySelector(".topbar")}
          alignOffset={24}
          align="end"
          className="z-[55] max-w-[calc(100vw-24px)]"
        >
          <Popover.Popup className="glass background-panel">
            <div className="flex items-start justify-between">
              <div>
                <h2>让空间，换个心情。</h2>
                <p>选择预设，立即预览。</p>
              </div>
              <Popover.Close aria-label="关闭背景设置" className="icon-button">
                <Icon name="x" size={15} />
              </Popover.Close>
            </div>
            <div className="grid grid-cols-2 gap-x-[14px] gap-y-4 mt-5">
              {wallpapers.map((p) => (
                <button
                  key={p.id}
                  className={
                    "wallpaper-choice " +
                    (appearance.wallpaper === p.id ? "chosen" : "")
                  }
                  onClick={() =>
                    onChange({
                      wallpaper: p.id,
                      strength:
                        appearance.strength ===
                        presetStrength(appearance.wallpaper)
                          ? presetStrength(p.id)
                          : appearance.strength,
                    })
                  }
                  aria-pressed={appearance.wallpaper === p.id}
                >
                  <img src={"/design/wallpapers/" + p.file} alt="" />
                  <span>
                    {p.name}
                    {appearance.wallpaper === p.id && (
                      <Icon name="circle-check" size={15} />
                    )}
                  </span>
                </button>
              ))}
            </div>
            <label className="block mt-5 background-intensity">
              <span className="flex justify-between text-xs">
                背景强度{" "}
                <output className="mono text-[11px] text-muted-foreground">
                  {appearance.strength}%
                </output>
              </span>
              <input
                className="w-full mt-[18px] accent-[#8c929c]"
                type="range"
                style={
                  {
                    "--range-progress": appearance.strength + "%",
                  } as CSSProperties
                }
                min="0"
                max="100"
                value={appearance.strength}
                onChange={(e) =>
                  onChange({ ...appearance, strength: Number(e.target.value) })
                }
                aria-label="背景强度"
              />
            </label>
            <p className="!text-[10px] mt-5">
              你的选择会自动保存，随时可以换回默认背景。
            </p>
            <div className="flex justify-between mt-auto pt-8">
              <button
                className="pill"
                onClick={() => onChange({ wallpaper: "silver", strength: 35 })}
              >
                恢复默认
                <Icon name="refresh" size={13} />
              </button>
              <Popover.Close className="pill primary">完成</Popover.Close>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
