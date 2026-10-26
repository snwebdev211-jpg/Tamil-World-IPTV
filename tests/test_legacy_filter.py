import unittest
from tools import legacy_filter as legacy


class LegacyFilterTests(unittest.TestCase):
    def test_real_mpegts_bytes(self):
        packet = b'\x47' + b'\x00'*187
        self.assertTrue(legacy.valid_ts(packet*4))
        self.assertFalse(legacy.valid_ts(b'<!DOCTYPE html>'*70))
        self.assertFalse(legacy.valid_ts(b'\x00'*1316))

    def test_media_segments(self):
        sample = ('#EXTM3U\n#EXT-X-TARGETDURATION:10\n'
                  '#EXT-X-MEDIA-SEQUENCE:1\n#EXTINF:10,\n1.ts\n'
                  '#EXTINF:10,\n2.ts\n#EXTINF:10,\n3.ts\n')
        urls=legacy.segment_candidate(sample,'https://example.org/live/main.m3u8')
        self.assertEqual(urls,['https://example.org/live/2.ts'])
        self.assertEqual(legacy.segment_candidate('#EXTM3U\n#EXT-X-TARGETDURATION:8\n'
                         '#EXT-X-KEY:METHOD=AES-128,URI="key"\n#EXTINF:8,\n1.ts',
                         'https://example.org/live/'), None)
        self.assertIsNone(legacy.segment_candidate('#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\n'
                         '#EXT-X-TARGETDURATION:8\n#EXTINF:8,\n1.m4s',
                         'https://example.org/live/'))

    def test_compatible_master(self):
        sample = ('#EXTM3U\n'
                  '#EXT-X-STREAM-INF:BANDWIDTH=9000000,RESOLUTION=3840x2160,CODECS="hvc1.1.1,mp4a.40.2"\n4k.m3u8\n'
                  '#EXT-X-STREAM-INF:BANDWIDTH=1900000,RESOLUTION=1280x720,CODECS="avc1.4d401f,mp4a.40.2"\nh264.m3u8\n')
        self.assertEqual(legacy.select_variant(sample,'https://example.org/root/index.m3u8'),
                         ['https://example.org/root/h264.m3u8'])

    def test_candidates_tamil_priority(self):
        tamil = {'id':'t', 'title':'Tamil One', 'url':'https://example.org/t.m3u8', 'group':'Tamil | News', 'meta':'#EXTINF:-1,Tamil One', 'opts':[]}
        sports = {'id':'s', 'title':'Sport One', 'url':'https://example.org/s.m3u8', 'group':'Sports', 'meta':'#EXTINF:-1,Sport One', 'opts':[]}
        self.assertEqual(legacy.candidates_for_legacy([sports,tamil])[0]['id'],'t')


if __name__=='__main__':
    unittest.main()
