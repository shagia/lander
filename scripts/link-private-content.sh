#!/usr/bin/env bash
# Link private collection content from a sibling git repo into this app.
# See docs/private-content.md for the full workflow.
set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTENT_REPO="${CONTENT_REPO:-$(cd "$APP_ROOT/.." && pwd)/lander-concept-content}"

rel_to_content_repo() {
	local from_dir=$1
	python3 -c 'import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))' "$CONTENT_REPO" "$from_dir"
}

PUBLIC_RELEASE_FILES=(.gitkeep template.md)
PUBLIC_ASSET_ENTRIES=(.gitkeep template)

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
EOF
}

ensure_content_repo() {
	mkdir -p \
		"$CONTENT_REPO/releases" \
		"$CONTENT_REPO/performances" \
		"$CONTENT_REPO/projects" \
		"$CONTENT_REPO/assets/releases" \
		"$CONTENT_REPO/assets/performances" \
		"$CONTENT_REPO/assets/projects"

	if [[ ! -d "$CONTENT_REPO/.git" ]]; then
		git -C "$CONTENT_REPO" init -b main
		printf '%s\n' '.DS_Store' >"$CONTENT_REPO/.gitignore"
		touch \
			"$CONTENT_REPO/releases/.gitkeep" \
			"$CONTENT_REPO/performances/.gitkeep" \
			"$CONTENT_REPO/projects/.gitkeep" \
			"$CONTENT_REPO/assets/performances/.gitkeep" \
			"$CONTENT_REPO/assets/projects/.gitkeep"
		echo "Initialized private content repo at $CONTENT_REPO"
	fi
}

is_public_release_file() {
	local name=$1
	local item
	for item in "${PUBLIC_RELEASE_FILES[@]}"; do
		[[ "$name" == "$item" ]] && return 0
	done
	return 1
}

is_public_asset_entry() {
	local name=$1
	local item
	for item in "${PUBLIC_ASSET_ENTRIES[@]}"; do
		[[ "$name" == "$item" ]] && return 0
	done
	return 1
}

migrate_collection_files() {
	local collection=$1
	local src="$APP_ROOT/src/content/$collection"
	local dest="$CONTENT_REPO/$collection"
	mkdir -p "$dest"
	[[ -d "$src" ]] || return 0

	local path base
	shopt -s nullglob
	for path in "$src"/*; do
		base=$(basename "$path")
		[[ -L "$path" ]] && continue
		if [[ "$collection" == "releases" ]] && is_public_release_file "$base"; then
			continue
		fi
		if [[ "$base" == ".gitkeep" ]]; then
			continue
		fi
		if [[ -f "$path" || -d "$path" ]]; then
			# If sibling already has this entry, replace with incoming Keystatic write
			if [[ -e "$dest/$base" || -L "$dest/$base" ]]; then
				rm -rf "$dest/$base"
			fi
			echo "migrate  $collection/$base"
			mv "$path" "$dest/$base"
		fi
	done
	shopt -u nullglob
}

migrate_asset_entries() {
	local collection=$1
	local src="$APP_ROOT/src/assets/$collection"
	local dest="$CONTENT_REPO/assets/$collection"
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
		echo "migrate  assets/$collection/$base"
		mv "$path" "$dest/$base"
	done
	shopt -u nullglob
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
	local src="$CONTENT_REPO/$collection"
	local dest="$APP_ROOT/src/content/$collection"
	mkdir -p "$dest"
	[[ -d "$src" ]] || return 0

	local rel path base
	rel="$(rel_to_content_repo "$dest")"
	shopt -s nullglob
	for path in "$src"/*; do
		base=$(basename "$path")
		[[ "$base" == ".gitkeep" ]] && continue
		if [[ "$collection" == "releases" ]] && is_public_release_file "$base"; then
			continue
		fi
		link_path "$rel/$collection/$base" "$dest/$base" "$quiet"
	done
	shopt -u nullglob
}

link_asset_entries() {
	local collection=$1
	local quiet=${2:-false}
	local src="$CONTENT_REPO/assets/$collection"
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
		link_path "$rel/assets/$collection/$base" "$dest/$base" "$quiet"
	done
	shopt -u nullglob
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
	find "$APP_ROOT/src/content" "$APP_ROOT/src/assets" -maxdepth 3 -type l -printf '  %p -> %l\n' 2>/dev/null | sort || true
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
fi

if ! $do_quiet; then
	echo
	show_status
fi
