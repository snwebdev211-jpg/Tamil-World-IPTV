import unittest
from tools import smartstb_filter as checker


def stream(url, group='Tamil | Entertainment'):
    return {'url': url, 'title': 'Channel', 'group': group,
            'id': 'Channel.in@SD', 'meta': '#EXTINF:-1,Channel', 'opts': []}


class HLSCompatibilityTests(unittest.TestCase):
    def test_hls_only(self):
        self.assertTrue(checker.is_hls_url(stream('https://example.com/live/master.m3u8')))
        self.assertFalse(checker.is_hls_url(stream('https://example.com/live/manifest.mpd')))
        self.assertFalse(checker.is_hls_url(stream('https://example.com/live.ts')))
        self.assertFalse(checker.is_hls_url(stream('https://example.com/movie.mp4')))

    def test_manifest_detection(self):
        self.assertTrue(checker.manifest_looks_compatible(
            '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXTINF:10,\na.ts\n'))
        self.assertFalse(checker.manifest_looks_compatible('<html>Forbidden</html>'))
        self.assertFalse(checker.manifest_looks_compatible('#EXTM3U\n#EXTINF:-1,TV\nhttps://example.com/tv.m3u8'))

    def test_filter_hevc_only(self):
        self.assertFalse(checker.manifest_looks_compatible(
            '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,CODECS="hvc1.2.4.L150.B0"\na.m3u8\n'))
        self.assertTrue(checker.manifest_looks_compatible(
            '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,CODECS="avc1.42E01E,mp4a.40.2"\na.m3u8\n'))

    def test_prioritize_tamil(self):
        entries = [
            stream('https://example.com/one.m3u8', group='Sports'),
            stream('https://example.com/tamil.m3u8', group='Tamil | Entertainment')]
        self.assertEqual(checker.choose_candidates(entries)[0]['group'], 'Tamil | Entertainment')


if __name__ == '__main__':
    unittest.main()
