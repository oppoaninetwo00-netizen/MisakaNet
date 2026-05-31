import unittest
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))

from new_lesson import _slugify


class TestNewLessonSlugify(unittest.TestCase):
    def test_slugify_removes_path_separators_and_special_characters(self):
        title = "Python / WSL \\ path: fix * invalid ? filename <chars> |"

        self.assertEqual(_slugify(title), "python-wsl-path-fix-invalid-filename-chars")

    def test_slugify_falls_back_when_title_has_no_safe_characters(self):
        title = "\U0001f680\U0001f525///\\\\"
        slug = _slugify(title)

        self.assertRegex(slug, r"^lesson-[0-9a-f]{8}$")

    def test_slugify_avoids_windows_reserved_names(self):
        self.assertRegex(_slugify("CON"), r"^lesson-[0-9a-f]{8}$")
        self.assertRegex(_slugify("LPT1"), r"^lesson-[0-9a-f]{8}$")

    def test_slugify_trims_after_length_limit(self):
        slug = _slugify("a" * 59 + " !!!")

        self.assertEqual(slug, "a" * 59)


if __name__ == "__main__":
    unittest.main()
