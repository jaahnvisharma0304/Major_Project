import os
import shutil

source_images = r"C:\Users\agarw\Downloads\disaster_priority_project\train_images_labels_targets\train\images"
source_targets = r"C:\Users\agarw\Downloads\disaster_priority_project\train_images_labels_targets\train\targets"

dest_pre = r"C:\Users\agarw\disaster_damage_project\data\pre"
dest_post = r"C:\Users\agarw\disaster_damage_project\data\post"
dest_mask = r"C:\Users\agarw\disaster_damage_project\data\mask"

os.makedirs(dest_pre, exist_ok=True)
os.makedirs(dest_post, exist_ok=True)
os.makedirs(dest_mask, exist_ok=True)

for file in os.listdir(source_images):

    if "pre_disaster" in file:
        shutil.copy(
            os.path.join(source_images,file),
            os.path.join(dest_pre,file.replace("_pre_disaster",""))
        )

    if "post_disaster" in file:
        shutil.copy(
            os.path.join(source_images,file),
            os.path.join(dest_post,file.replace("_post_disaster",""))
        )

for file in os.listdir(source_targets):

    if "post_disaster" in file:
        shutil.copy(
            os.path.join(source_targets,file),
            os.path.join(dest_mask,file.replace("_post_disaster_target",""))
        )

print("Dataset prepared successfully")