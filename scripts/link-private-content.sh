#!/usr/bin/env bash
# Link private collection content + optional brand overlay from a sibling git repo.
# See docs/private-content.md for the full workflow.
set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTENT_REPO="${CONTENT_REPO:-$(cd "$APP_ROOT/.." && pwd)/lander-concept-content}"

rel_to_content_repo() {
	local from_dir=$1
	python3 -c 'import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))' "$CONTENT_REPO" "$from_dir"
}

# Template-owned collection files — never migrate or overwrite with private links.
PUBLIC_RELEASE_FILES=(.gitkeep template.md sample.md)
PUBLIC_PROJECT_FILES=(.gitkeep sample.md)
PUBLIC_PERFORMANCE_FILES=(.gitkeep sample.md)
PUBLIC_ASSET_ENTRIES=(.gitkeep template sample-cover.svg)

# Brand paths that may be overlaid from the content repo when present.
BRAND_APP_PATHS=(
	src/Site.yaml
	src/content/site/About.md
	src/assets/ui/logo.svg
	src/assets/ui/logo-dark.svg
	src/assets/ui/logo-white.svg
	src/assets/ui/banner.svg
	src/assets/ui/banner.jpeg
	src/assets/ui/banner2.jpeg
	src/assets/ui/icon.svg
	src/assets/ui/icon.png
	public/favicon.svg
	public/favicon.ico
)

usage() {
	cat <<'EOF'
Usage: scripts/link-private-content.sh [--migrate] [--watch] [--unlink] [--status] [--quiet]

  (default)   Create/refresh symlinks from the sibling content repo into src/
  --migrate   Move non-public files from this app into the sibling repo first
  --watch     Migrate+link once, then auto-migrate when Keystatic writes new files
  --unlink    Remove symlinks from this app (does not delete sibling files)
  --status    Show link status
  --quiet     Less status output (used by the watcher)

Environment:
  CONTENT_REPO   Absolute path to the private content repo
                 (default: ../lander-concept-content next to this project)

Brand overlay (optional files in the content repo):
  src/Site.yaml
  src/content/site/About.md
  src/assets/ui/*   (logos, banner, icon)
  public/favicon.svg, public/favicon.ico
EOF
}

# Sibling repo mirrors the app paths Keystatic writes, plus optional brand:
#   lander-concept-content/src/Site.yaml
#   lander-concept-content/src/content/{site,releases,performances,projects}
#   lander-concept-content/src/assets/{ui,releases,performances,projects}
#   lander-concept-content/public/favicon.*
CONTENT_SRC="$CONTENT_REPO/src"

ensure_content_repo() {
	mkdir -p \
		"$CONTENT_SRC/content/site" \
		"$CONTENT_SRC/content/releases" \
		"$CONTENT_SRC/content/performances" \
		"$CONTENT_SRC/content/projects" \
		"$CONTENT_SRC/assets/ui" \
		"$CONTENT_SRC/assets/releases" \
		"$CONTENT_SRC/assets/performances" \
		"$CONTENT_SRC/assets/projects" \
		"$CONTENT_REPO/public"

	if [[ ! -d "$CONTENT_REPO/.git" ]]; then
		git -C "$CONTENT_REPO" init -b main
		printf '%s\n' '.DS_Store' >"$CONTENT_REPO/.gitignore"
		touch \
			"$CONTENT_SRC/content/releases/.gitkeep" \
			"$CONTENT_SRC/content/performances/.gitkeep" \
			"$CONTENT_SRC/content/projects/.gitkeep" \
			"$CONTENT_SRC/assets/performances/.gitkeep" \
			"$CONTENT_SRC/assets/projects/.gitkeep"
		echo "Initialized private content repo at $CONTENT_REPO"
	fi
}

list_contains() {
	local needle=$1
	shift
	local item
	for item in "$@"; do
		[[ "$item" == "$needle" ]] && return 0
	done
	return 1
}

is_public_content_file() {
	local collection=$1
	local name=$2
	case "$collection" in
		releases) list_contains "$name" "${PUBLIC_RELEASE_FILES[@]}" ;;
		projects) list_contains "$name" "${PUBLIC_PROJECT_FILES[@]}" ;;
		performances) list_contains "$name" "${PUBLIC_PERFORMANCE_FILES[@]}" ;;
		*) [[ "$name" == ".gitkeep" ]] ;;
	esac
}

is_public_asset_entry() {
	local name=$1
	list_contains "$name" "${PUBLIC_ASSET_ENTRIES[@]}"
}

migrate_collection_files() {
	local collection=$1
	local src="$APP_ROOT/src/content/$collection"
	local dest="$CONTENT_SRC/content/$collection"
	mkdir -p "$dest"
	[[ -d "$src" ]] || return 0

	local path base
	shopt -s nullglob
	for path in "$src"/*; do
		base=$(basename "$path")
		[[ -L "$path" ]] && continue
		if is_public_content_file "$collection" "$base"; then
			continue
		fi
		if [[ -f "$path" || -d "$path" ]]; then
			if [[ -e "$dest/$base" || -L "$dest/$base" ]]; then
				rm -rf "$dest/$base"
			fi
			echo "migrate  src/content/$collection/$base"
			mv "$path" "$dest/$base"
		fi
	done
	shopt -u nullglob
}

migrate_asset_entries() {
	local collection=$1
	local src="$APP_ROOT/src/assets/$collection"
	local dest="$CONTENT_SRC/assets/$collection"
	mkdir -p "$dest"
	[[ -d "$src" ]] || return 0

	local path base
	shopt -s nullglob
	for path in "$src"/*; do
		base=$(basename "$path")
		[[ -L "$path" ]] && continue
		if [[ "$collection" == "releases" ]] && is_public_asset_entry "$base"; then
			continue
		fi
		if [[ "$base" == ".gitkeep" ]]; then
			continue
		fi
		if [[ -e "$dest/$base" || -L "$dest/$base" ]]; then
			rm -rf "$dest/$base"
		fi
		echo "migrate  src/assets/$collection/$base"
		mv "$path" "$dest/$base"
	done
	shopt -u nullglob
}

# Replace app path with symlink to content-repo target (even if a real file exists).
link_force() {
	local target=$1
	local link=$2
	local quiet=${3:-false}
	mkdir -p "$(dirname "$link")"
	if [[ -L "$link" ]]; then
		ln -sfn "$target" "$link"
		$quiet || echo "relink   $link -> $target"
	elif [[ -e "$link" ]]; then
		rm -f "$link"
		ln -s "$target" "$link"
		echo "overlay  $link -> $target"
	else
		ln -s "$target" "$link"
		echo "link     $link -> $target"
	fi
}

link_path() {
	local target=$1
	local link=$2
	local quiet=${3:-false}
	mkdir -p "$(dirname "$link")"
	if [[ -L "$link" ]]; then
		ln -sfn "$target" "$link"
		$quiet || echo "relink   $link -> $target"
	elif [[ -e "$link" ]]; then
		$quiet || echo "skip     $link (real file/dir exists; not replacing)"
	else
		ln -s "$target" "$link"
		echo "link     $link -> $target"
	fi
}

link_collection_files() {
	local collection=$1
	local quiet=${2:-false}
	local src="$CONTENT_SRC/content/$collection"
	local dest="$APP_ROOT/src/content/$collection"
	mkdir -p "$dest"
	[[ -d "$src" ]] || return 0

	local rel path base
	rel="$(rel_to_content_repo "$dest")"
	shopt -s nullglob
	for path in "$src"/*; do
		base=$(basename "$path")
		if is_public_content_file "$collection" "$base"; then
			continue
		fi
		link_path "$rel/src/content/$collection/$base" "$dest/$base" "$quiet"
	done
	shopt -u nullglob
}

link_asset_entries() {
	local collection=$1
	local quiet=${2:-false}
	local src="$CONTENT_SRC/assets/$collection"
	local dest="$APP_ROOT/src/assets/$collection"
	mkdir -p "$dest"
	[[ -d "$src" ]] || return 0

	local rel path base
	rel="$(rel_to_content_repo "$dest")"
	shopt -s nullglob
	for path in "$src"/*; do
		base=$(basename "$path")
		[[ "$base" == ".gitkeep" ]] && continue
		if [[ "$collection" == "releases" ]] && is_public_asset_entry "$base"; then
			continue
		fi
		link_path "$rel/src/assets/$collection/$base" "$dest/$base" "$quiet"
	done
	shopt -u nullglob
}

link_brand_overlay() {
	local quiet=${1:-false}
	local app_rel content_abs link_parent rel
	for app_rel in "${BRAND_APP_PATHS[@]}"; do
		content_abs="$CONTENT_REPO/$app_rel"
		[[ -e "$content_abs" || -L "$content_abs" ]] || continue
		link_parent="$(dirname "$APP_ROOT/$app_rel")"
		rel="$(rel_to_content_repo "$link_parent")"
		link_force "$rel/$app_rel" "$APP_ROOT/$app_rel" "$quiet"
	done
}

unlink_symlinks_in() {
	local dir=$1
	[[ -d "$dir" ]] || return 0
	local path
	shopt -s nullglob
	for path in "$dir"/*; do
		if [[ -L "$path" ]]; then
			echo "unlink   $path"
			rm "$path"
		fi
	done
	shopt -u nullglob
}

unlink_brand_overlay() {
	local app_rel restored=()
	for app_rel in "${BRAND_APP_PATHS[@]}"; do
		if [[ -L "$APP_ROOT/$app_rel" ]]; then
			echo "unlink   $APP_ROOT/$app_rel"
			rm "$APP_ROOT/$app_rel"
			restored+=("$app_rel")
		fi
	done
	if ((${#restored[@]})); then
		# Prefer git-tracked template defaults when available.
		if git -C "$APP_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
			git -C "$APP_ROOT" restore --source=HEAD --worktree --staged -- "${restored[@]}" 2>/dev/null \
				|| git -C "$APP_ROOT" checkout HEAD -- "${restored[@]}" 2>/dev/null \
				|| true
		fi
	fi
}

show_status() {
	echo "App:     $APP_ROOT"
	echo "Content: $CONTENT_REPO"
	echo
	if [[ -d "$CONTENT_REPO/.git" ]]; then
		echo "Sibling git: $(git -C "$CONTENT_REPO" rev-parse --short HEAD) ($(git -C "$CONTENT_REPO" status --porcelain | wc -l | tr -d ' ') dirty paths)"
	else
		echo "Sibling git: missing"
	fi
	echo
	echo "Symlinks:"
	{
		find "$APP_ROOT/src/content" "$APP_ROOT/src/assets" -maxdepth 3 -type l -printf '  %p -> %l\n' 2>/dev/null || true
		find "$APP_ROOT/public" -maxdepth 1 -type l -printf '  %p -> %l\n' 2>/dev/null || true
		[[ -L "$APP_ROOT/src/Site.yaml" ]] && printf '  %s -> %s\n' "$APP_ROOT/src/Site.yaml" "$(readlink "$APP_ROOT/src/Site.yaml")"
	} | sort -u
}

migrate_and_link() {
	local quiet=${1:-false}
	ensure_content_repo
	for collection in releases performances projects; do
		migrate_collection_files "$collection"
		migrate_asset_entries "$collection"
	done
	for collection in releases performances projects; do
		link_collection_files "$collection" "$quiet"
		link_asset_entries "$collection" "$quiet"
	done
	link_brand_overlay "$quiet"
}

do_migrate=false
do_unlink=false
do_status=false
do_watch=false
do_quiet=false

for arg in "$@"; do
	case "$arg" in
		-h|--help) usage; exit 0 ;;
		--migrate) do_migrate=true ;;
		--watch) do_watch=true ;;
		--unlink) do_unlink=true ;;
		--status) do_status=true ;;
		--quiet) do_quiet=true ;;
		*) echo "Unknown option: $arg" >&2; usage; exit 1 ;;
	esac
done

if $do_status; then
	show_status
	exit 0
fi

if $do_unlink; then
	for collection in releases performances projects; do
		unlink_symlinks_in "$APP_ROOT/src/content/$collection"
		unlink_symlinks_in "$APP_ROOT/src/assets/$collection"
	done
	unlink_brand_overlay
	echo "Done. Public template files were left in place."
	exit 0
fi

if $do_watch; then
	exec node "$APP_ROOT/scripts/watch-private-content.mjs"
fi

ensure_content_repo

if $do_migrate; then
	migrate_and_link "$do_quiet"
	$do_quiet || echo "Migration complete. Commit inside $CONTENT_REPO when ready."
else
	for collection in releases performances projects; do
		link_collection_files "$collection" "$do_quiet"
		link_asset_entries "$collection" "$do_quiet"
	done
	link_brand_overlay "$do_quiet"
fi

if ! $do_quiet; then
	echo
	show_status
fi
