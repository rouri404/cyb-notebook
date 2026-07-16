import os
import glob
Import("env")

# Remove LVGL Helium assembly files immediately during configuration phase
libdeps_dir = env.subst("$PROJECT_LIBDEPS_DIR/$PIOENV/lvgl/src/draw/sw/blend/helium")
if os.path.exists(libdeps_dir):
    for f in glob.glob(os.path.join(libdeps_dir, "*.S")):
        print(f"Removing offending assembly file: {f}")
        os.remove(f)
