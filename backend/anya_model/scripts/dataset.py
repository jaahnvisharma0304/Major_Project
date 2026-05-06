import os
import cv2
import numpy as np
import torch
from torch.utils.data import Dataset

class DamageDataset(Dataset):

    def __init__(self, pre_dir, post_dir, mask_dir, size=192, limit=700):

        self.pre_dir = pre_dir
        self.post_dir = post_dir
        self.mask_dir = mask_dir
        self.size = size

        self.files = sorted(os.listdir(pre_dir))

        if limit:
            self.files = self.files[:limit]

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):

        name = self.files[idx]

        pre_path = os.path.join(self.pre_dir, name)
        post_path = os.path.join(self.post_dir, name)
        mask_path = os.path.join(self.mask_dir, name)

        pre = cv2.imread(pre_path)
        post = cv2.imread(post_path)
        mask = cv2.imread(mask_path, 0)

        pre = cv2.resize(pre, (self.size, self.size))
        post = cv2.resize(post, (self.size, self.size))
        mask = cv2.resize(mask, (self.size, self.size))

        diff = cv2.absdiff(pre, post)

        image = np.concatenate([pre, post, diff], axis=2)

        image = image / 255.0

        image = np.transpose(image, (2,0,1))

        mask = (mask > 0).astype(np.int64)

        return torch.tensor(image).float(), torch.tensor(mask)