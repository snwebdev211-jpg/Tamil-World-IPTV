import unittest
from tools import build


def channel(title, group, url='https://example.com/live.m3u8', channel_id='example.test'):
    return {
        'title': title,
        'group': group,
        'url': url,
        'id': channel_id,
        'opts': [],
        'meta': '#EXTINF:-1 tvg-id="' + channel_id + '" group-title="' + group + '",' + title,
    }


class PlaylistTests(unittest.TestCase):
    def test_parse_and_category(self):
        data = ('#EXTM3U\n'
                '#EXTINF:-1 tvg-id="foo" group-title="Sports",Foo TV\n'
                'https://example.com/live.m3u8\n')
        items = build.parse(data)
        self.assertEqual(len(items), 1)
        self.assertEqual(build.category(items[0]), 'Sports')

    def test_group_tag(self):
        item = channel('Tamil Movie', 'Movies')
        line = build.put_category(item, 'Tamil | Movies')
        self.assertEqual(line.count('group-title='), 1)
        self.assertIn('group-title="Tamil | Movies"', line)

    def test_quoted_commas_do_not_corrupt_channel_names_or_groups(self):
        ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
        data = ('#EXTM3U\n'
                '#EXTINF:-1 tvg-id="warner" http-user-agent="' + ua +
                '" group-title="Entertainment",Warner TV Asia (720p)\n'
                '#EXTVLCOPT:http-user-agent=' + ua + '\n'
                'https://example.com/warner.m3u8\n')
        items = build.parse(data)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['title'], 'Warner TV Asia (720p)')
        self.assertEqual(items[0]['group'], 'Entertainment')
        self.assertEqual(items[0]['opts'], ['#EXTVLCOPT:http-user-agent=' + ua])
        renamed = build.put_category(items[0], 'Tamil | Entertainment')
        self.assertEqual(renamed.count('group-title='), 1)
        self.assertIn('http-user-agent="' + ua + '"', renamed)
        self.assertTrue(renamed.endswith(',Warner TV Asia (720p)'))
        roundtrip = build.parse('#EXTM3U\n' + renamed + '\n'
                                + items[0]['opts'][0] + '\n' + items[0]['url'] + '\n')
        self.assertEqual(roundtrip[0]['title'], 'Warner TV Asia (720p)')
        self.assertEqual(roundtrip[0]['group'], 'Tamil | Entertainment')

    def test_sports_and_movies(self):
        self.assertEqual(build.category(channel('SportTV', 'Sports')), 'Sports')
        self.assertEqual(build.category(channel('Movie Planet', 'Movies')), 'Movies')
        self.assertTrue(build.is_movie(channel('Movie Planet', 'Movies')))

    def test_tamil_sort_first(self):
        a = channel('World Sports', 'Sports', 'https://example.com/a.m3u8', 'a')
        b = channel('Sun TV', 'Entertainment', 'https://example.com/b.m3u8', 'b')
        groups = {build.key(a): 'Sports', build.key(b): 'Tamil | Entertainment'}
        self.assertEqual(sorted([a, b], key=lambda c: build.order(c, groups))[0], b)

    def test_non_public_or_private_link_excluded(self):
        self.assertFalse(build.safe('http://127.0.0.1/private'))
        self.assertFalse(build.safe('file:///tmp/a'))
        self.assertFalse(build.safe('https://example.com/play?access_token=secret'))
        self.assertTrue(build.safe('https://example.com/live.m3u8'))


if __name__ == '__main__':
    unittest.main()
